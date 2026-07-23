// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db, practiceTests, practiceTestItems, questions, topics, uploads, withRetry } from "@/lib/db";
import { eq, inArray, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const maxDuration = 60;

function genId() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const tests = await withRetry(() =>
      db.select().from(practiceTests).where(eq(practiceTests.userId, userId)).orderBy(desc(practiceTests.createdAt))
    );

    // Add item counts manually for compatibility
    const testsWithCounts = await Promise.all(
      tests.map(async (t) => {
        const items = await withRetry(() => db.select().from(practiceTestItems).where(eq(practiceTestItems.testId, t.id)));
        return {
          ...t,
          _count: { items: items.length },
        };
      })
    );

    return NextResponse.json({ tests: testsWithCounts });
  } catch (err) {
    return apiError(err, 500, "Failed to fetch practice tests");
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fallbackOptions(question: string, idx: number): { options: string[]; correctAnswer: string } {
  const base = question.slice(0, 80).replace(/\s+/g, " ").trim();
  const keywords = question.split(" ").slice(0, 4).join(" ");
  // Create 4 plausible, neutral options without revealing which is correct
  const correct = `${base} — This accurately describes the core principle and expected outcome.`;
  const distractors = [
    `An alternative view: ${keywords} is primarily about secondary effects rather than the main mechanism (common misconception).`,
    `This suggests ${base.slice(0, 30)}... corresponds to a different concept, often confused due to similar terminology.`,
    `This option describes a related but distinct scenario for question ${idx + 1}, not directly addressing the asked concept.`,
  ];

  // Ensure all 4 are distinct and neutrally worded (no "Correct" label)
  const all = shuffleArray([correct, ...distractors]);
  return { options: all, correctAnswer: correct };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const { topicIds, questionCount, difficulty } = await request.json();
    const count = questionCount || 5;

    // Get user uploads
    const userUploads = await withRetry(() => db.select({ id: uploads.id }).from(uploads).where(eq(uploads.userId, userId)));
    const uploadIds = userUploads.map((u) => u.id);

    if (uploadIds.length === 0) {
      return NextResponse.json({ error: "No past paper questions found. Upload papers first." }, { status: 404 });
    }

    // Fetch questions matching filter
    let allQuestions = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)));

    if (topicIds && topicIds.length > 0) {
      allQuestions = allQuestions.filter((q) => q.topicId && topicIds.includes(q.topicId));
    }
    if (difficulty && difficulty !== "ALL") {
      allQuestions = allQuestions.filter((q) => q.difficulty === difficulty);
    }

    const selectedQuestions = allQuestions.slice(0, count);

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No past paper questions found matching your filter criteria. Upload papers first." },
        { status: 404 }
      );
    }

    // Enrich with topic names
    const topicIdsSet = selectedQuestions.map((q) => q.topicId).filter(Boolean) as string[];
    let topicMap = new Map<string, any>();
    if (topicIdsSet.length > 0) {
      const tRows = await withRetry(() => db.select().from(topics).where(inArray(topics.id, topicIdsSet)));
      topicMap = new Map(tRows.map((t) => [t.id, t]));
    }

    const hasKey = !!process.env.OPENAI_API_KEY;
    const itemsData: Array<{ questionId: string; options: string[]; correctAnswer: string; explanation: string }> = [];

    const systemPrompt = `You are an academic test generator.
Based on the provided exam question, generate exactly 4 distinct multiple-choice options (A, B, C, D) where only one option is correct.
Provide:
1. An array of 4 options.
2. The exact text of the correct option (must be one of the four choices).
3. A clear, concise explanation of why that option is correct.`;

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      if (hasKey) {
        try {
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
          // Shuffle options to avoid positional bias (correct not always first)
          const shuffled = shuffleArray(object.options);
          itemsData.push({
            questionId: q.id,
            options: shuffled,
            correctAnswer: object.correctAnswer,
            explanation: object.explanation,
          });
          continue;
        } catch (e) {
          console.error("[PracticeTest] OpenAI generation failed, fallback:", e);
        }
      }
      const { options: fbOptions, correctAnswer: fbCorrect } = fallbackOptions(q.content, i);
      itemsData.push({
        questionId: q.id,
        options: fbOptions,
        correctAnswer: fbCorrect,
        explanation: `This question focuses on the core principle behind: "${q.content.slice(0, 120)}". Review the relevant definitions, work through examples, and compare with similar past questions to deepen understanding.`,
      });
    }

    const testId = genId();
    const topicName = selectedQuestions[0]?.topicId ? topicMap.get(selectedQuestions[0].topicId!)?.name : "Topic";

    await withRetry(() =>
      db.insert(practiceTests).values({
        id: testId,
        title: `${topicName || "Topic"} Practice Quiz`,
        totalQuestions: selectedQuestions.length,
        userId,
      })
    );

    const itemsToInsert = itemsData.map((it) => ({
      id: genId(),
      testId,
      questionId: it.questionId,
      options: it.options,
      correctAnswer: it.correctAnswer,
      explanation: it.explanation,
    }));

    let insertedItems: any[] = [];
    if (itemsToInsert.length > 0) {
      insertedItems = await withRetry(() => db.insert(practiceTestItems).values(itemsToInsert).returning());
    }

    // Need question content for client
    const questionMap = new Map(selectedQuestions.map((q) => [q.id, q]));

    const clientItems = insertedItems.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      questionText: questionMap.get(item.questionId)?.content || "",
      topic: questionMap.get(item.questionId)?.topicId ? topicMap.get(questionMap.get(item.questionId)!.topicId!)?.name || "General" : "General",
      options: item.options,
    }));

    return NextResponse.json({
      testId,
      title: `${topicName || "Topic"} Practice Quiz`,
      totalQuestions: selectedQuestions.length,
      items: clientItems,
    });
  } catch (error) {
    return apiError(error, 500, "Failed to generate practice test");
  }
}
