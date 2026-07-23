import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRecommendations } from "@/lib/recommendations";
import { RecommendationsView } from "./_recommendations-view";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  let items: Awaited<ReturnType<typeof getRecommendations>> = [];
  try {
    items = await getRecommendations(session.user.id);
  } catch (err) {
    console.error("[Recommendations] Failed to load, using fallback:", err);
  }
  return <RecommendationsView items={items} />;
}
