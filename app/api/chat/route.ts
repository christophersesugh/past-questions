// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { streamText, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { db, chatSessions, chatMessages, uploads, questions, neonSql, withRetry } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export const maxDuration = 60;

function genId() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

function fallbackSearch(query: string, qs: Array<{ id: string; content: string; filename: string }>) {
  const qLower = query.toLowerCase();
  const terms = qLower.split(/\s+/).filter(Boolean);
  return qs
    .map((qq) => {
      let score = 0;
      const cLower = qq.content.toLowerCase();
      terms.forEach((t) => {
        if (cLower.includes(t)) score += 1;
      });
      return { ...qq, similarity: terms.length ? score / terms.length : 0 };
    })
    .filter((x) => x.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const { message, sessionId } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const title = message.length > 35 ? message.substring(0, 32) + "..." : message;
      const id = genId();
      const [newSession] = await withRetry(() =>
        db
          .insert(chatSessions)
          .values({
            id,
            title,
            userId,
          })
          .returning()
      );
      activeSessionId = newSession.id;
    } else {
      const [existing] = await withRetry(() =>
        db
          .select()
          .from(chatSessions)
          .where(and(eq(chatSessions.id, activeSessionId), eq(chatSessions.userId, userId)))
          .limit(1)
      );
      if (!existing) {
        return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
      }
    }

    await withRetry(() =>
      db.insert(chatMessages).values({
        id: genId(),
        content: message,
        role: "USER",
        sessionId: activeSessionId,
      })
    );

    const hasKey = !!process.env.OPENAI_API_KEY;
    let matchedQuestions: Array<{ id: string; content: string; uploadFilename: string; similarity: number }> = [];

    if (hasKey) {
      try {
        const { embedding } = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: message,
        });

        // Vector search using Neon HTTP raw query - works with pgvector
        const vecStr = `[${embedding.join(",")}]`;
        const rawMatches = await neonSql`
          SELECT q.id, q.content, u.filename as "uploadFilename",
                 (1 - (q.embedding <=> ${vecStr}::vector)) AS similarity
          FROM "Question" q
          JOIN "Upload" u ON q."uploadId" = u.id
          WHERE u."userId" = ${userId} AND q.embedding IS NOT NULL
          ORDER BY similarity DESC
          LIMIT 3
        `;

        matchedQuestions = rawMatches.map((r: any) => ({
          id: r.id,
          content: r.content,
          uploadFilename: r.uploadFilename,
          similarity: parseFloat(r.similarity) || 0,
        }));

        if (matchedQuestions.length === 0) {
          // Fallback keyword
          const userUploads = await withRetry(() => db.select({ id: uploads.id, filename: uploads.filename }).from(uploads).where(eq(uploads.userId, userId)));
          const uploadIds = userUploads.map((u) => u.id);
          const filenameById = new Map(userUploads.map((u) => [u.id, u.filename]));
          let allQs: any[] = [];
          if (uploadIds.length > 0) {
            allQs = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)).limit(50));
          }
          const fallback = fallbackSearch(
            message,
            allQs.map((qq) => ({ id: qq.id, content: qq.content, filename: filenameById.get(qq.uploadId) || "paper" }))
          );
          matchedQuestions = fallback.map((f) => ({
            id: f.id,
            content: f.content,
            uploadFilename: f.filename,
            similarity: f.similarity,
          }));
        }
      } catch (e) {
        console.error("[Chat] Embedding search failed, using fallback keyword search", e);
      }
    }

    if (matchedQuestions.length === 0) {
      const userUploads = await withRetry(() => db.select({ id: uploads.id, filename: uploads.filename }).from(uploads).where(eq(uploads.userId, userId)));
      const uploadIds = userUploads.map((u) => u.id);
      const filenameById = new Map(userUploads.map((u) => [u.id, u.filename]));
      let allQs: any[] = [];
      if (uploadIds.length > 0) {
        allQs = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)).limit(100));
      }
      const fallback = fallbackSearch(
        message,
        allQs.map((qq) => ({ id: qq.id, content: qq.content, filename: filenameById.get(qq.uploadId) || "paper" }))
      );
      matchedQuestions = fallback.map((f) => ({
        id: f.id,
        content: f.content,
        uploadFilename: f.filename,
        similarity: f.similarity,
      }));
    }

    const sources = matchedQuestions.map((q) => ({
      paper: q.uploadFilename,
      question: q.content,
      similarity: `${Math.round(q.similarity * 100)}%`,
    }));

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
2. Output clean, structured markdown. Write equations using LaTeX where helpful.
3. If code is needed, use code blocks with language annotations.
4. Keep the tone helpful, encouraging, and academic.`;

    if (!hasKey) {
      const fallbackAnswer = contextText
        ? `Based on your uploaded past questions, here's what I found relevant to "${message}":\n\n${contextText}\n\n**Answer:**\n\nKey insights:\n- Review the matched questions above\n- Focus on core definitions and examples\n- For "${message}", consider studying the surrounding topics in your papers.`
        : `I couldn't find directly matching past questions for "${message}" in your library.\n\nSuggestions:\n- Upload more past papers covering this topic\n- Try rephrasing your question with keywords from your past questions\n- Study related topics: check Recommendations page`;

      await withRetry(() =>
        db.insert(chatMessages).values({
          id: genId(),
          content: fallbackAnswer,
          role: "ASSISTANT",
          sessionId: activeSessionId,
        })
      );

      await withRetry(() =>
        db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, activeSessionId))
      );

      return NextResponse.json({
        answer: fallbackAnswer,
        sources,
        sessionId: activeSessionId,
        fallback: true,
      });
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: message,
      onFinish: async ({ text }) => {
        await withRetry(() =>
          db.insert(chatMessages).values({
            id: genId(),
            content: text,
            role: "ASSISTANT",
            sessionId: activeSessionId,
          })
        );
        await withRetry(() =>
          db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, activeSessionId))
        );
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "x-sources": encodeURIComponent(JSON.stringify(sources)),
        "x-session-id": activeSessionId,
      },
    });
  } catch (error) {
    return apiError(error, 500, "Failed to process chat message");
  }
}
