import { prisma } from "@/lib/prisma";

export type RecommendationItem = {
  id: string;
  topic: string;
  frequency: number;
  userAccuracy: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE";
  reason: string;
};

export async function getRecommendations(userId: string): Promise<RecommendationItem[]> {
  const [uploads, topics] = await Promise.all([
    prisma.upload.count({ where: { userId } }),
    prisma.topic.findMany({
      include: {
        questions: {
          where: { upload: { userId } },
          select: {
            id: true,
            testItems: {
              where: { test: { userId } },
              select: { isCorrect: true },
            },
          },
        },
      },
    }),
  ]);

  if (uploads === 0) return [];

  const totalUploads = Math.max(uploads, 1);

  const items: RecommendationItem[] = topics
    .map((t) => {
      const frequency = Math.round((t.questions.length / totalUploads) * 100);
      const answered = t.questions.flatMap((q) => q.testItems);
      const accuracy =
        answered.length === 0
          ? null
          : Math.round(
              (answered.filter((i) => i.isCorrect === true).length / answered.length) * 100
            );

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
}
