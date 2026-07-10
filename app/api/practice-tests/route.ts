import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const maxDuration = 60; // Extend Next.js timeout for generating multiple questions in batch

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const { userId, error } = await requireUser();
    if (error) return error;

    // 2. Parse request body
    const { topicIds, questionCount, difficulty } = await request.json();
    const count = questionCount || 5;

    // 3. Query questions matching criteria
    const questions = await prisma.question.findMany({
      where: {
        topicId: topicIds && topicIds.length > 0 ? { in: topicIds } : undefined,
        difficulty: difficulty === "ALL" ? undefined : difficulty,
        upload: {
          userId,
        },
      },
      take: count,
      include: {
        topic: true,
      },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No past paper questions found matching your filter criteria." },
        { status: 404 }
      );
    }

    // 4. Generate a multiple-choice structure for each question
    const itemsData = [];
    const systemPrompt = `You are an academic test generator.
Based on the provided exam question, generate exactly 4 distinct multiple-choice options (A, B, C, D) where only one option is correct.
Provide:
1. An array of 4 options.
2. The exact text of the correct option (must be one of the four choices).
3. A clear, concise explanation of why that option is correct.`;

    for (const q of questions) {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        schema: z.object({
          options: z.array(z.string()).length(4).describe("Four distinct multiple choice options"),
          correctAnswer: z.string().describe("The exact text of the correct option"),
          explanation: z.string().describe("Clear academic explanation of the correct choice"),
        }),
        prompt: `Question: "${q.content}"`,
      });

      itemsData.push({
        questionId: q.id,
        options: object.options,
        correctAnswer: object.correctAnswer,
        explanation: object.explanation,
      });
    }

    // 5. Create PracticeTest record and items in database
    const test = await prisma.practiceTest.create({
      data: {
        title: `${questions[0]?.topic?.name || "Topic"} Practice Quiz`,
        totalQuestions: questions.length,
        userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            question: true,
          },
        },
      },
    });

    // 6. Redact correctAnswers and explanations from the client-facing payload
    const clientItems = test.items.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      questionText: item.question.content,
      topic: questions.find((q) => q.id === item.questionId)?.topic?.name || "General",
      options: item.options,
    }));

    return NextResponse.json({
      testId: test.id,
      title: test.title,
      totalQuestions: test.totalQuestions,
      items: clientItems,
    });
  } catch (error) {
    console.error("Practice Test API Error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
