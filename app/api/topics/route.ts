// @ts-nocheck
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { db, topics, uploads, questions, withRetry, neonSql } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    // Use raw SQL for accurate join counting - works with neon-http
    // Select topics that have questions belonging to user's uploads, with counts
    try {
      const rows = await neonSql`
        SELECT t.id, t.name, COUNT(q.id)::int as "questionCount"
        FROM "Topic" t
        JOIN "Question" q ON q."topicId" = t.id
        JOIN "Upload" u ON q."uploadId" = u.id
        WHERE u."userId" = ${userId}
        GROUP BY t.id, t.name
        ORDER BY t.name ASC
      `;
      return NextResponse.json({ topics: rows });
    } catch (rawErr) {
      console.warn("[Topics] Raw SQL failed, falling back to drizzle queries:", rawErr);
      // Fallback: fetch user uploads, then questions, then topics
      const userUploads = await withRetry(() => db.select({ id: uploads.id }).from(uploads).where(eq(uploads.userId, userId)));
      const uploadIds = userUploads.map((u) => u.id);
      if (uploadIds.length === 0) {
        return NextResponse.json({ topics: [] });
      }
      const qs = await withRetry(() => db.select().from(questions).where(inArray(questions.uploadId, uploadIds)));
      const topicCounts = new Map<string, number>();
      for (const q of qs) {
        if (q.topicId) {
          topicCounts.set(q.topicId, (topicCounts.get(q.topicId) || 0) + 1);
        }
      }
      const topicIds = Array.from(topicCounts.keys());
      if (topicIds.length === 0) {
        return NextResponse.json({ topics: [] });
      }
      const topicRows = await withRetry(() => db.select().from(topics).where(inArray(topics.id, topicIds)));
      const formatted = topicRows
        .map((t) => ({
          id: t.id,
          name: t.name,
          questionCount: topicCounts.get(t.id) || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json({ topics: formatted });
    }
  } catch (err) {
    return apiError(err, 500, "Failed to fetch topics");
  }
}
