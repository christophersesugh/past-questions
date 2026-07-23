// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db, topics, questions, flashcards, uploads, withRetry } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

function genId() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const { topicId, topicIds } = await request.json();
    const ids = topicIds || (topicId ? [topicId] : []);

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const topicRows = await withRetry(() => db.select().from(topics).where(inArray(topics.id, ids)));

    if (topicRows.length === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Get user uploads to scope questions
    const userUploads = await withRetry(() => db.select({ id: uploads.id }).from(uploads).where(eq(uploads.userId, userId)));
    const uploadIds = userUploads.map((u) => u.id);

    if (uploadIds.length === 0) {
      return NextResponse.json({ error: "No uploads found" }, { status: 404 });
    }

    const questionRows = await withRetry(() =>
      db
        .select()
        .from(questions)
        .where(inArray(questions.uploadId, uploadIds))
    );
    const filteredQuestions = questionRows.filter((q) => q.topicId && ids.includes(q.topicId!)).slice(0, 12);

    if (filteredQuestions.length === 0) {
      return NextResponse.json(
        { error: "No past paper questions found for this topic to generate flashcards." },
        { status: 404 }
      );
    }

    const hasKey = !!process.env.OPENAI_API_KEY;
    let generatedCards: Array<{ questionId: string; front: string; back: string }> = [];

    if (hasKey) {
      try {
        const systemPrompt = `You are a study card developer. Your task is to generate active recall study flashcards based on the provided exam questions.
For each question:
1. Generate a "front" containing a clear, concise question or key term.
2. Generate a "back" containing a concise, exact conceptual explanation or answer.
Ensure that the flashcards cover the key points of the questions and are easy to read.`;

        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          schema: z.object({
            cards: z.array(
              z.object({
                questionId: z.string().describe("The ID of the matching source question"),
                front: z.string().describe("Short prompt or definition key on the front of card"),
                back: z.string().describe("Core concise answer or explanation on the back of card"),
              })
            ),
          }),
          prompt: `Generate flashcards for the following exam questions:\n\n${JSON.stringify(
            filteredQuestions.map((q) => ({ id: q.id, content: q.content }))
          )}`,
        });
        generatedCards = object.cards;
      } catch (e) {
        console.error("[Flashcards] OpenAI failed, using fallback", e);
      }
    }

    if (generatedCards.length === 0) {
      generatedCards = filteredQuestions.slice(0, 8).map((q) => ({
        questionId: q.id,
        front: q.content.length > 80 ? q.content.slice(0, 80) + "?" : q.content,
        back: `Key concept: ${q.content.slice(0, 150)}. Focus on the definition, key steps, and a concise example to reinforce recall.`,
      }));
    }

    const savedFlashcards = [];
    for (const card of generatedCards) {
      const matchingQuestion = filteredQuestions.find((q) => q.id === card.questionId);
      if (matchingQuestion || filteredQuestions.length > 0) {
        const qId = matchingQuestion?.id ?? filteredQuestions[0]?.id;
        const [savedCard] = await withRetry(() =>
          db
            .insert(flashcards)
            .values({
              id: genId(),
              front: card.front,
              back: card.back,
              questionId: qId,
            })
            .returning()
        );
        savedFlashcards.push(savedCard);
      }
    }

    return NextResponse.json({
      message: "Flashcards generated successfully.",
      deckName: topicRows[0]?.name || "Study Deck",
      cards: savedFlashcards,
    });
  } catch (error) {
    return apiError(error, 500, "Failed to generate flashcards");
  }
}
