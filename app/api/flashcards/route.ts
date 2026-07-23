// @ts-nocheck
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { db, flashcards, questions, topics, uploads, withRetry, neonSql } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    // Fetch flashcards where question belongs to user's upload OR questionId null
    // Use raw SQL for join performance with Neon HTTP
    let rows: any[] = [];
    try {
      rows = await neonSql`
        SELECT f.id, f.front, f.back, f."questionId", f."createdAt",
               q.content as "questionContent", q."topicId",
               t.name as "topicName"
        FROM "Flashcard" f
        LEFT JOIN "Question" q ON f."questionId" = q.id
        LEFT JOIN "Topic" t ON q."topicId" = t.id
        LEFT JOIN "Upload" u ON q."uploadId" = u.id
        WHERE (u."userId" = ${userId} OR f."questionId" IS NULL)
        ORDER BY f."createdAt" DESC
      `;
    } catch {
      // Fallback drizzle queries
      const userUploads = await withRetry(() => db.select({ id: uploads.id }).from(uploads).where(eq(uploads.userId, userId)));
      const uploadIds = userUploads.map((u) => u.id);
      let questionIds: string[] = [];
      if (uploadIds.length > 0) {
        const qs = await withRetry(() => db.select({ id: questions.id }).from(questions).where(inArray(questions.uploadId, uploadIds)));
        questionIds = qs.map((q) => q.id);
      }
      const allCards = await withRetry(() => db.select().from(flashcards));
      const filtered = allCards.filter((c) => !c.questionId || questionIds.includes(c.questionId));
      // Enrich with question + topic info
      rows = await Promise.all(
        filtered.map(async (c) => {
          let qContent = null;
          let topicId = null;
          let topicName = "General Revision";
          if (c.questionId) {
            const [q] = await withRetry(() => db.select().from(questions).where(eq(questions.id, c.questionId!)).limit(1));
            if (q) {
              qContent = q.content;
              topicId = q.topicId;
              if (q.topicId) {
                const [t] = await withRetry(() => db.select().from(topics).where(eq(topics.id, q.topicId!)).limit(1));
                if (t) topicName = t.name;
              }
            }
          }
          return {
            id: c.id,
            front: c.front,
            back: c.back,
            questionId: c.questionId,
            createdAt: c.createdAt,
            questionContent: qContent,
            topicId,
            topicName,
          };
        })
      );
    }

    const decksMap = new Map<string, typeof rows>();
    for (const card of rows) {
      const topicName = card.topicName ?? "General Revision";
      const existing = decksMap.get(topicName) ?? [];
      existing.push(card);
      decksMap.set(topicName, existing);
    }

    const decks = Array.from(decksMap.entries()).map(([topicName, cards]) => ({
      id: `deck-${topicName.replace(/\s+/g, "-").toLowerCase()}`,
      topicName,
      cardCount: cards.length,
      lastStudied: "Not studied yet",
      mastery: 0,
      cards: cards.map((c: any) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        sourceQuestion: c.questionContent,
        topicId: c.topicId,
      })),
    }));

    return NextResponse.json({
      decks,
      flashcards: rows.map((c: any) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        questionId: c.questionId,
        topic: c.topicName ?? "General Revision",
      })),
    });
  } catch (err) {
    return apiError(err, 500, "Failed to fetch flashcards");
  }
}
