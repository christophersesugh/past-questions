// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { unlink } from "node:fs/promises";
import { db, uploads, questions, topics, withRetry } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, error } = await requireUser();
    if (error) return error;

    const [upload] = await withRetry(() =>
      db.select().from(uploads).where(and(eq(uploads.id, id), eq(uploads.userId, userId))).limit(1)
    );

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    await withRetry(() => db.delete(uploads).where(eq(uploads.id, id)));

    if (upload.storagePath) {
      try {
        await unlink(upload.storagePath);
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    return apiError(err, 500, "Failed to delete upload");
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, error } = await requireUser();
    if (error) return error;

    const [upload] = await withRetry(() =>
      db.select().from(uploads).where(and(eq(uploads.id, id), eq(uploads.userId, userId))).limit(1)
    );

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const qs = await withRetry(() => db.select().from(questions).where(eq(questions.uploadId, id)));

    const topicIds = qs.map((q) => q.topicId).filter(Boolean) as string[];
    let topicMap = new Map<string, string>();
    if (topicIds.length > 0) {
      const ts = await withRetry(() => db.select().from(topics).where(inArray(topics.id, topicIds)));
      topicMap = new Map(ts.map((t) => [t.id, t.name]));
    }

    return NextResponse.json({
      id: upload.id,
      filename: upload.filename,
      fileSize: upload.fileSize,
      status: upload.status,
      questionCount: qs.length,
      questions: qs.map((q) => ({
        id: q.id,
        content: q.content,
        difficulty: q.difficulty,
        topic: q.topicId ? topicMap.get(q.topicId) ?? "General Revision" : "General Revision",
        topicId: q.topicId,
      })),
      createdAt: upload.createdAt,
    });
  } catch (err) {
    return apiError(err, 500, "Failed to fetch upload");
  }
}
