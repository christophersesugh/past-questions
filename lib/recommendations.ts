// @ts-nocheck
import { db, uploads, topics, questions, practiceTestItems, withRetry, neonSql } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export type RecommendationItem = {
  id: string;
  topic: string;
  frequency: number;
  userAccuracy: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE";
  reason: string;
};

export async function getRecommendations(userId: string): Promise<RecommendationItem[]> {
  try {
    const userUploads = await withRetry(() => db.select({ id: uploads.id }).from(uploads).where(eq(uploads.userId, userId)));
    const uploadCount = userUploads.length;
    if (uploadCount === 0) return [];

    const uploadIds = userUploads.map((u) => u.id);

    let topicRows: any[] = [];
    let questionRows: any[] = [];

    try {
      // Try efficient raw SQL aggregation with Neon HTTP
      const rows = await neonSql`
        SELECT t.id, t.name, COUNT(q.id)::int as "questionCount"
        FROM "Topic" t
        JOIN "Question" q ON q."topicId" = t.id
        JOIN "Upload" u ON q."uploadId" = u.id
        WHERE u."userId" = ${userId}
        GROUP BY t.id, t.name
      `;
      topicRows = rows as any[];

      questionRows = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)));

      // Fetch test items for accuracy
      const qIds = questionRows.map((q) => q.id);
      let itemsByQuestion = new Map<string, any[]>();
      if (qIds.length > 0) {
        const items = await withRetry(() => db.select().from(practiceTestItems).where(inArray(practiceTestItems.questionId, qIds)));
        for (const it of items) {
          if (!itemsByQuestion.has(it.questionId)) itemsByQuestion.set(it.questionId, []);
          itemsByQuestion.get(it.questionId)!.push(it);
        }
      }

      const totalUploads = Math.max(uploadCount, 1);
      const items: RecommendationItem[] = topicRows
        .map((t: any) => {
          const qsForTopic = questionRows.filter((q: any) => q.topicId === t.id);
          const frequency = Math.round((qsForTopic.length / totalUploads) * 100);
          const answered = qsForTopic.flatMap((q: any) => itemsByQuestion.get(q.id) || []);
          const accuracy =
            answered.length === 0
              ? null
              : Math.round((answered.filter((i: any) => i.isCorrect === true).length / answered.length) * 100);

          let priority: RecommendationItem["priority"];
          let reason: string;

          if (accuracy === null) {
            priority = frequency >= 60 ? "CRITICAL" : "MEDIUM";
            reason =
              frequency >= 60
                ? `Appears in ${frequency}% of exam papers. You haven't answered any practice questions on this topic yet.`
                : `Moderate occurrence (${frequency}%). Try a quick flashcard session to gauge your understanding.`;
          } else if (frequency >= 70 && accuracy < 60) {
            priority = "CRITICAL";
            reason = `Appears in ${frequency}% of exam papers, but your average accuracy is only ${accuracy}%. Focus here immediately.`;
          } else if (frequency >= 50 && accuracy < 80) {
            priority = "HIGH";
            reason = `High occurrence rate (${frequency}%). Your accuracy is ${accuracy}%; we recommend review and flashcard recall.`;
          } else if (accuracy >= 80) {
            priority = "STABLE";
            reason = `Appears in ${frequency}% of papers and you have ${accuracy}% accuracy. Maintain this level with quick weekly chat reviews.`;
          } else {
            priority = "MEDIUM";
            reason = `Moderate exam concentration (${frequency}%). You have a solid base but need practice on edge cases.`;
          }

          return { id: t.id, topic: t.name, frequency, userAccuracy: accuracy ?? 0, priority, reason };
        })
        .filter((i) => i.frequency > 0)
        .sort((a, b) => {
          const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, STABLE: 3 } as const;
          return order[a.priority] - order[b.priority] || b.frequency - a.frequency;
        });

      return items;
    } catch (fallback) {
      // Fallback drizzle-only path
      console.warn("[Recommendations] Raw query failed, using fallback", fallback);
      const tRows = await withRetry(() => db.select().from(topics));
      const qRows = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)));
      const totalUploads = Math.max(uploadCount, 1);
      return tRows
        .map((t) => {
          const qsForTopic = qRows.filter((q) => q.topicId === t.id);
          const frequency = Math.round((qsForTopic.length / totalUploads) * 100);
          return {
            id: t.id,
            topic: t.name,
            frequency,
            userAccuracy: 0,
            priority: (frequency >= 60 ? "CRITICAL" : "MEDIUM") as RecommendationItem["priority"],
            reason: `Appears in ${frequency}% of papers.`,
          };
        })
        .filter((i) => i.frequency > 0);
    }
  } catch (e) {
    console.error("[Recommendations] Failed:", e);
    return [];
  }
}
