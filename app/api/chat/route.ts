import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamText, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { ChatRole } from "@/lib/generated/prisma/enums";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate session
    const { userId, error } = await requireUser();
    if (error) return error;

    // 2. Parse request body
    const { message, sessionId } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 3. Resolve or Create ChatSession record
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Auto-generate title from message preview
      const title = message.length > 35 ? message.substring(0, 32) + "..." : message;
      const newSession = await prisma.chatSession.create({
        data: {
          title,
          userId,
        },
      });
      activeSessionId = newSession.id;
    }

    // Save User message
    await prisma.chatMessage.create({
      data: {
        content: message,
        role: "USER",
        sessionId: activeSessionId,
      },
    });

    // 4. Generate search embedding for query
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: message,
    });

    // 5. Query matching questions using pgvector cosine distance, scoped to the user's uploads
    const matchedQuestions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT q.id, q.content, q.difficulty, u.filename as "uploadFilename",
              (1 - (q.embedding <=> $1::vector)) AS similarity
       FROM "Question" q
       JOIN "Upload" u ON q."uploadId" = u.id
       WHERE u."userId" = $2
       ORDER BY similarity DESC
       LIMIT 3`,
      `[${embedding.join(",")}]`,
      userId
    );

    // Filter out low-matching results (e.g. similarity < 0.25) if needed
    const sources = matchedQuestions.map((q) => ({
      paper: q.uploadFilename,
      question: q.content,
      similarity: `${Math.round(q.similarity * 100)}%`,
    }));

    // 6. Build RAG system prompt with grounding context
    const contextText = matchedQuestions
      .map(
        (q, idx) =>
          `[Source ${idx + 1}] (From paper: ${q.uploadFilename}, Match: ${Math.round(
            q.similarity * 100
          )}%):\n"${q.content}"`
      )
      .join("\n\n");

    const systemPrompt = `You are StudyAI, an expert conversational tutor. Your task is to explain academic concepts to the student.
You must base your explanations on the following exam questions retrieved from their uploaded papers. If the query is unrelated to the context, answer generally but remind them of the related topics in their past papers.

Retrieved Past Question Context:
${contextText || "No matching questions were found in the uploaded papers."}

Guidelines:
1. Ground your answers in the context. Refer to the sources where appropriate (e.g. "As seen in [Source 1]...").
2. Output clean, structured markdown. Write equations using LaTeX (e.g. \\(E = mc^2\\) or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).
3. If code is needed, use code blocks with language annotations.
4. Keep the tone helpful, encouraging, and academic.`;

    // 7. Stream text response using Vercel AI SDK
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: message,
      onFinish: async ({ text }) => {
        // Save Assistant reply when streaming completes
        await prisma.chatMessage.create({
          data: {
            content: text,
            role: ChatRole.ASSISTANT,
            sessionId: activeSessionId,
          },
        });
        
        // Update session timestamp
        await prisma.chatSession.update({
          where: { id: activeSessionId },
          data: { updatedAt: new Date() },
        });
      },
    });

    // 8. Return data stream response with custom sources header for UI drawer
    return result.toTextStreamResponse({
      headers: {
        "x-sources": JSON.stringify(sources),
        "x-session-id": activeSessionId,
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
