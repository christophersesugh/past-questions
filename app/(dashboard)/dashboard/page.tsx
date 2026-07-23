import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db, users, withRetry } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardView } from "./_dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  let userName = session.user.name ?? "there";
  let stats = {
    uploads: 0,
    questions: 0,
    flashcardsStudied: 0,
    practiceTests: 0,
    averageScore: null as number | null,
  };
  let activities: Awaited<ReturnType<typeof getDashboardData>>["activities"] = [];
  let recommendedTopics: Awaited<ReturnType<typeof getDashboardData>>["recommendedTopics"] = [];

  try {
    const [userRows, data] = await Promise.all([
      withRetry(() => db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1)) as Promise<{ name: string }[]>,
      getDashboardData(userId),
    ]);
    const user = (userRows as { name: string }[])[0];
    userName = user?.name ?? session.user.name ?? "there";
    stats = data.stats;
    activities = data.activities;
    recommendedTopics = data.recommendedTopics;
  } catch (err) {
    console.error("[Dashboard] Failed to load data, using fallback:", err);
  }

  return (
    <DashboardView
      userName={userName}
      stats={stats}
      activities={activities}
      recommendedTopics={recommendedTopics}
    />
  );
}
