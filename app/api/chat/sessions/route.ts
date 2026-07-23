// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { db, chatSessions, chatMessages, withRetry, neonSql } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    // Use raw SQL for count + recent ordering that works with Neon HTTP
    try {
      const rows = await neonSql`
        SELECT s.id, s.title, s."updatedAt", s."createdAt",
               COUNT(m.id)::int as "messageCount"
        FROM "ChatSession" s
        LEFT JOIN "ChatMessage" m ON m."sessionId" = s.id
        WHERE s."userId" = ${userId}
        GROUP BY s.id, s.title, s."updatedAt", s."createdAt"
        ORDER BY s."updatedAt" DESC
      `;
      const formatted = rows.map((s: any) => ({
        id: s.id,
        title: s.title,
        date: new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        messageCount: s.messageCount,
      }));
      return NextResponse.json({ sessions: formatted });
    } catch {
      // Fallback drizzle
      const sessions = await withRetry(() =>
        db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt))
      );
      const formatted = await Promise.all(
        sessions.map(async (s) => {
          const msgs = await withRetry(() => db.select().from(chatMessages).where(eq(chatMessages.sessionId, s.id)));
          return {
            id: s.id,
            title: s.title,
            date: new Date(s.updatedAt as any).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            updatedAt: s.updatedAt,
            createdAt: s.createdAt,
            messageCount: msgs.length,
          };
        })
      );
      return NextResponse.json({ sessions: formatted });
    }
  } catch (err) {
    return apiError(err, 500, "Failed to fetch chat sessions");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const [existing] = await withRetry(() =>
      db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
        .limit(1)
    );

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await withRetry(() => db.delete(chatSessions).where(eq(chatSessions.id, sessionId)));

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    return apiError(err, 500, "Failed to delete session");
  }
}
