import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const { userId, error } = await requireUser();
    if (error) return error;

    // 2. Parse request body
    const { topicId } = await request.json();
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // 3. Query questions under this topic that the user has uploaded
    const questions = await prisma.question.findMany({
      where: {
        topicId,
        upload: {
          userId,
        },
      },
      take: 8, // Limit generation size per request
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No past paper questions found for this topic to generate flashcards." },
        { status: 404 }
      );
    }

    // 4. Call Vercel AI SDK to generate structured flashcards (Front/Back)
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
        questions.map((q) => ({ id: q.id, content: q.content }))
      )}`,
    });

    // 5. Store generated flashcards in database
    const savedFlashcards = [];
    for (const card of object.cards) {
      // Confirm the question exists and belongs to the query list
      const matchingQuestion = questions.find((q) => q.id === card.questionId);
      if (matchingQuestion) {
        const savedCard = await prisma.flashcard.create({
          data: {
            front: card.front,
            back: card.back,
            questionId: card.questionId,
          },
        });
        savedFlashcards.push(savedCard);
      }
    }

    return NextResponse.json({
      message: "Flashcards generated successfully.",
      deckName: topic.name,
      cards: savedFlashcards,
    });
  } catch (error) {
    console.error("Flashcards Generator Error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
