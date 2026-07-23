// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { db, practiceTests, practiceTestItems, questions, withRetry } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const { testId, answers } = await request.json();
    if (!testId || !answers) {
      return NextResponse.json({ error: "Test ID and answers are required" }, { status: 400 });
    }

    const [test] = await withRetry(() =>
      db.select().from(practiceTests).where(and(eq(practiceTests.id, testId), eq(practiceTests.userId, userId))).limit(1)
    );

    if (!test) {
      return NextResponse.json({ error: "Practice test not found" }, { status: 404 });
    }

    const items = await withRetry(() => db.select().from(practiceTestItems).where(eq(practiceTestItems.testId, testId)));

    if (items.length === 0) {
      return NextResponse.json({ error: "No items found for test" }, { status: 404 });
    }

    let correctCount = 0;
    const evaluatedItems = [];

    for (const item of items) {
      const selected = answers[item.id] || null;
      const isCorrect = selected === item.correctAnswer;

      if (isCorrect) correctCount++;

      await withRetry(() =>
        db
          .update(practiceTestItems)
          .set({
            selectedAnswer: selected,
            isCorrect,
          })
          .where(eq(practiceTestItems.id, item.id))
      );

      // Fetch question content
      const [q] = await withRetry(() => db.select().from(questions).where(eq(questions.id, item.questionId)).limit(1));

      evaluatedItems.push({
        id: item.id,
        questionId: item.questionId,
        questionText: q?.content || "",
        options: item.options,
        correctAnswer: item.correctAnswer,
        selectedAnswer: selected,
        isCorrect,
        explanation: item.explanation,
      });
    }

    await withRetry(() =>
      db.update(practiceTests).set({ score: correctCount }).where(eq(practiceTests.id, testId))
    );

    return NextResponse.json({
      testId: test.id,
      title: test.title,
      score: correctCount,
      totalQuestions: test.totalQuestions,
      items: evaluatedItems,
    });
  } catch (error) {
    return apiError(error, 500, "Failed to submit quiz answers");
  }
}
