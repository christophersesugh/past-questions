import { prisma } from "@/lib/prisma";
import { UploadStatus } from "@/lib/generated/prisma/enums";

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
  const [uploads, questions, practiceTests, recentUploads, recentTests, recentSessions, topicAgg] =
    await Promise.all([
      prisma.upload.count({ where: { userId } }),
      prisma.question.count({ where: { upload: { userId } } }),
      prisma.practiceTest.findMany({
        where: { userId, score: { not: null } },
        select: { score: true, totalQuestions: true },
      }),
      prisma.upload.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { questions: true } } },
      }),
      prisma.practiceTest.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { _count: { select: { messages: true } } },
      }),
      prisma.topic.findMany({
        include: {
          questions: {
            where: { upload: { userId } },
            select: { id: true, uploadId: true, testItems: { where: { test: { userId } }, select: { isCorrect: true } } },
          },
        },
      }),
    ]);

  const averageScore =
    practiceTests.length === 0
      ? null
      : Math.round(
          (practiceTests.reduce(
            (acc, t) => acc + (t.totalQuestions === 0 ? 0 : (t.score ?? 0) / t.totalQuestions),
            0
          ) /
            practiceTests.length) *
            100
        );

  const stats: DashboardStats = {
    uploads,
    questions,
    flashcardsStudied: 0, // No per-user card-review log yet; left as 0 honestly.
    practiceTests: practiceTests.length,
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
    ...recentUploads.map<RecentActivity>((u) => ({
      id: `u-${u.id}`,
      type: "upload",
      title: `Uploaded '${u.filename}'`,
      time: formatAgo(u.createdAt),
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
      time: formatAgo(t.updatedAt),
      status:
        t.score !== null && t.totalQuestions > 0
          ? `Score: ${t.score}/${t.totalQuestions} (${Math.round((t.score / t.totalQuestions) * 100)}%)`
          : "In progress",
      badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    })),
    ...recentSessions.map<RecentActivity>((s) => ({
      id: `s-${s.id}`,
      type: "chat",
      title: `Tutored on '${s.title}'`,
      time: formatAgo(s.updatedAt),
      status: `${s._count.messages} messages`,
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    })),
  ]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 5);

  const totalUploads = Math.max(uploads, 1);
  const recommendedTopics: RecommendedTopic[] = topicAgg
    .map((t) => {
      const frequency = Math.round((t.questions.length / totalUploads) * 100);
      const answered = t.questions.flatMap((q) => q.testItems);
      const accuracy =
        answered.length === 0
          ? null
          : Math.round(
              (answered.filter((i) => i.isCorrect === true).length / answered.length) * 100
            );
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
    .filter((t) => t.frequency > 0)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  return { stats, activities, recommendedTopics };
}
