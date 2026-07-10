import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const { userId, error } = await requireUser();
    if (error) return error;

    // 2. Parse request body
    const { testId, answers } = await request.json();
    if (!testId || !answers) {
      return NextResponse.json({ error: "Test ID and answers are required" }, { status: 400 });
    }

    // Verify test exists and belongs to the user
    const test = await prisma.practiceTest.findUnique({
      where: { id: testId, userId },
      include: {
        items: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Practice test not found" }, { status: 404 });
    }

    // 3. Evaluate selected answers and compute final score
    let correctCount = 0;
    const evaluatedItems = [];

    for (const item of test.items) {
      const selected = answers[item.id] || null;
      const isCorrect = selected === item.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      // Update the database record for the item
      const updatedItem = await prisma.practiceTestItem.update({
        where: { id: item.id },
        data: {
          selectedAnswer: selected,
          isCorrect,
        },
      });

      evaluatedItems.push({
        id: item.id,
        questionId: item.questionId,
        questionText: item.question.content,
        options: item.options,
        correctAnswer: item.correctAnswer,
        selectedAnswer: selected,
        isCorrect,
        explanation: item.explanation,
      });
    }

    // 4. Save computed score to PracticeTest table
    await prisma.practiceTest.update({
      where: { id: testId },
      data: {
        score: correctCount,
      },
    });

    return NextResponse.json({
      testId: test.id,
      title: test.title,
      score: correctCount,
      totalQuestions: test.totalQuestions,
      items: evaluatedItems,
    });
  } catch (error) {
    console.error("Quiz Submission API Error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
