// @ts-nocheck
import { db, uploads, questions, practiceTests, practiceTestItems, chatSessions, chatMessages, topics, neonSql, withRetry } from "@/lib/db";
import { eq, inArray, desc } from "drizzle-orm";

export type DashboardStats = {
  uploads: number;
  questions: number;
  flashcardsStudied: number;
  practiceTests: number;
  averageScore: number | null;
};

export type RecentActivity = {
  id: string;
  type: "upload" | "quiz" | "chat";
  title: string;
  time: string;
  status: string;
  badgeColor: string;
};

export type RecommendedTopic = {
  name: string;
  frequency: number;
  accuracy: number;
  status: "High Priority" | "Needs Review" | "Mastered";
};

export async function getDashboardData(userId: string): Promise<{
  stats: DashboardStats;
  activities: RecentActivity[];
  recommendedTopics: RecommendedTopic[];
}> {
  try {
    // Use raw SQL where possible for efficiency with Neon HTTP
    const userUploads = await withRetry(() => db.select().from(uploads).where(eq(uploads.userId, userId)));
    const uploadIds = userUploads.map((u) => u.id);

    let questionCount = 0;
    let questionRows: any[] = [];
    if (uploadIds.length > 0) {
      questionRows = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)));
      questionCount = questionRows.length;
    }

    const practiceTestRows = await withRetry(() => db.select().from(practiceTests).where(eq(practiceTests.userId, userId)));

    const completedTests = practiceTestRows.filter((t) => t.score !== null);

    const recentUploads = [...userUploads].sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()).slice(0, 5);
    const recentUploadsWithCounts = await Promise.all(
      recentUploads.map(async (u) => {
        const count = questionRows.filter((q) => q.uploadId === u.id).length;
        return { ...u, _count: { questions: count } };
      })
    );

    const recentTests = [...practiceTestRows].sort((a, b) => new Date(b.updatedAt as any).getTime() - new Date(a.updatedAt as any).getTime()).slice(0, 5);

    const chatSessionRows = await withRetry(() => db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(5));
    const recentSessionsWithCounts = await Promise.all(
      chatSessionRows.map(async (s) => {
        const msgs = await withRetry(() => db.select().from(chatMessages).where(eq(chatMessages.sessionId, s.id)));
        return { ...s, _count: { messages: msgs.length } };
      })
    );

    // Topics aggregation
    let topicAgg: any[] = [];
    try {
      // Get topics with their questions belonging to user
      const rows = await neonSql`
        SELECT t.id, t.name, q.id as "questionId", q."uploadId"
        FROM "Topic" t
        LEFT JOIN "Question" q ON q."topicId" = t.id
        LEFT JOIN "Upload" u ON q."uploadId" = u.id AND u."userId" = ${userId}
        WHERE q.id IS NOT NULL OR t.id IN (
          SELECT q2."topicId" FROM "Question" q2 JOIN "Upload" u2 ON q2."uploadId" = u2.id WHERE u2."userId" = ${userId}
        )
      `;
      // Group by topic
      const map = new Map<string, { id: string; name: string; questions: any[] }>();
      for (const r of rows as any[]) {
        if (!r.questionId) continue;
        if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name, questions: [] });
        map.get(r.id)!.questions.push({ id: r.questionId, uploadId: r.uploadId });
      }
      topicAgg = Array.from(map.values());
      // Fetch testItems accuracy for each question
      const allQuestionIds = topicAgg.flatMap((t) => t.questions.map((q: any) => q.id));
      if (allQuestionIds.length > 0) {
        const testItems = await withRetry(() => db.select().from(practiceTestItems).where(inArray(practiceTestItems.questionId, allQuestionIds)));
        // Map questionId -> testItems accuracy
        const itemsByQuestion = new Map<string, typeof testItems>();
        for (const item of testItems) {
          if (!itemsByQuestion.has(item.questionId)) itemsByQuestion.set(item.questionId, []);
          itemsByQuestion.get(item.questionId)!.push(item);
        }
        topicAgg = topicAgg.map((t) => ({
          ...t,
          questions: t.questions.map((q: any) => ({
            ...q,
            testItems: itemsByQuestion.get(q.id) || [],
          })),
        }));
      }
    } catch {
      // Fallback simple: topics from questions
      const topicIds = questionRows.map((q) => q.topicId).filter(Boolean) as string[];
      const uniqueTopicIds = Array.from(new Set(topicIds));
      if (uniqueTopicIds.length > 0) {
        const tRows = await withRetry(() => db.select().from(topics).where(inArray(topics.id, uniqueTopicIds)));
        topicAgg = tRows.map((t) => ({
          id: t.id,
          name: t.name,
          questions: questionRows
            .filter((q) => q.topicId === t.id)
            .map((q) => ({ id: q.id, uploadId: q.uploadId, testItems: [] })),
        }));
      }
    }

    const averageScore =
      completedTests.length === 0
        ? null
        : Math.round(
            (completedTests.reduce(
              (acc, t) => acc + (t.totalQuestions === 0 ? 0 : (t.score ?? 0) / t.totalQuestions),
              0
            ) /
              completedTests.length) *
              100
          );

    const stats: DashboardStats = {
      uploads: userUploads.length,
      questions: questionCount,
      flashcardsStudied: 0,
      practiceTests: completedTests.length,
      averageScore,
    };

    const formatAgo = (d: Date) => {
      const diff = Date.now() - d.getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return "Just now";
      if (m < 60) return `${m} min ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
      const days = Math.floor(h / 24);
      if (days === 1) return "Yesterday";
      return `${days} days ago`;
    };

    const activities: RecentActivity[] = [
      ...recentUploadsWithCounts.map<RecentActivity>((u) => ({
        id: `u-${u.id}`,
        type: "upload",
        title: `Uploaded '${u.filename}'`,
        time: formatAgo(new Date(u.createdAt as any)),
        status:
          u.status === "COMPLETED"
            ? `Processed (${u._count.questions} questions extracted)`
            : u.status === "PROCESSING"
            ? "Processing"
            : "Error",
        badgeColor:
          u.status === "COMPLETED"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : u.status === "ERROR"
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      })),
      ...recentTests.map<RecentActivity>((t) => ({
        id: `t-${t.id}`,
        type: "quiz",
        title: `Completed '${t.title}'`,
        time: formatAgo(new Date(t.updatedAt as any)),
        status:
          t.score !== null && t.totalQuestions > 0
            ? `Score: ${t.score}/${t.totalQuestions} (${Math.round((t.score / t.totalQuestions) * 100)}%)`
            : "In progress",
        badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      })),
      ...recentSessionsWithCounts.map<RecentActivity>((s) => ({
        id: `s-${s.id}`,
        type: "chat",
        title: `Tutored on '${s.title}'`,
        time: formatAgo(new Date(s.updatedAt as any)),
        status: `${s._count.messages} messages`,
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      })),
    ]
      .sort((a, b) => (a.time < b.time ? 1 : -1))
      .slice(0, 5);

    const totalUploads = Math.max(userUploads.length, 1);
    const recommendedTopics: RecommendedTopic[] = topicAgg
      .map((t: any) => {
        const frequency = Math.round((t.questions.length / totalUploads) * 100);
        const answered = t.questions.flatMap((q: any) => q.testItems);
        const accuracy =
          answered.length === 0
            ? null
            : Math.round((answered.filter((i: any) => i.isCorrect === true).length / answered.length) * 100);
        let status: RecommendedTopic["status"] = "Needs Review";
        if (accuracy === null) {
          status = frequency >= 60 ? "High Priority" : "Needs Review";
        } else if (accuracy >= 80) {
          status = "Mastered";
        } else if (frequency >= 70 && accuracy < 60) {
          status = "High Priority";
        } else {
          status = "Needs Review";
        }
        return { name: t.name, frequency, accuracy: accuracy ?? 0, status };
      })
      .filter((t: any) => t.frequency > 0)
      .sort((a: any, b: any) => b.frequency - a.frequency)
      .slice(0, 3);

    return { stats, activities, recommendedTopics };
  } catch (e) {
    console.error("[Dashboard] getDashboardData failed, returning fallback:", e);
    return {
      stats: { uploads: 0, questions: 0, flashcardsStudied: 0, practiceTests: 0, averageScore: null },
      activities: [],
      recommendedTopics: [],
    };
  }
}
