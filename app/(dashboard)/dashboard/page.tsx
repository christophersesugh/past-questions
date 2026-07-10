import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardView } from "./_dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, data] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getDashboardData(userId),
  ]);

  return (
    <DashboardView
      userName={user?.name ?? session.user.name ?? "there"}
      stats={data.stats}
      activities={data.activities}
      recommendedTopics={data.recommendedTopics}
    />
  );
}
