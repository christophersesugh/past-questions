// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { extractTextFromBuffer } from "@/lib/extractor";
import { generateObject, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db, uploads, questions, topics, neonSql, withRetry } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export const maxDuration = 60;

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);
const ALLOWED_EXT = new Set(["pdf", "docx", "txt"]);
const STORAGE_DIR = process.env.UPLOAD_STORAGE_DIR ?? join(/*turbopackIgnore: true */ process.cwd(), ".uploads");

type Difficulty = "EASY" | "MEDIUM" | "HARD";
function normalizeDifficulty(value: string): Difficulty {
  if (value === "EASY" || value === "MEDIUM" || value === "HARD") return value as Difficulty;
  return "MEDIUM";
}
function genId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

function fallbackParseQuestions(rawText: string): Array<{ content: string; difficulty: Difficulty; topic: string }> {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  const questionsArr: Array<{ content: string; difficulty: Difficulty; topic: string }> = [];
  const topicKeywords: Record<string, string[]> = {
    "Process Synchronization": ["semaphore", "mutex", "critical section", "synchronization", "race"],
    "Memory Management": ["paging", "segmentation", "virtual memory", "mmu", "thrashing"],
    "Database Normalization": ["normal form", "functional dependency", "candidate key", "normalization"],
    "Transaction Management": ["acid", "transaction", "2pl", "serializability", "locking"],
    "CPU Scheduling": ["scheduling", "scheduler", "fcfs", "sjf", "round robin"],
    "General Revision": [],
  };

  let buffer = "";
  for (const line of lines) {
    if (/^\s*(\d+[\.\)]|Q\d+[\.:]|Question\s*\d+)/i.test(line) || line.endsWith("?")) {
      if (buffer.length > 30) {
        questionsArr.push({ content: buffer, difficulty: "MEDIUM", topic: inferTopic(buffer, topicKeywords) });
      }
      buffer = line;
    } else {
      buffer += " " + line;
      if (buffer.length > 400) {
        questionsArr.push({ content: buffer, difficulty: "MEDIUM", topic: inferTopic(buffer, topicKeywords) });
        buffer = "";
      }
    }
  }
  if (buffer.length > 30) {
    questionsArr.push({ content: buffer, difficulty: "MEDIUM", topic: inferTopic(buffer, topicKeywords) });
  }

  if (questionsArr.length === 0 && rawText.trim().length > 50) {
    const chunks = rawText.match(/[^.!?]+[.!?]+/g) || [rawText];
    for (let i = 0; i < Math.min(5, chunks.length); i++) {
      const c = chunks[i].trim();
      if (c.length > 30) {
        questionsArr.push({ content: c, difficulty: "MEDIUM", topic: inferTopic(c, topicKeywords) });
      }
    }
  }

  return questionsArr.slice(0, 20);
}

function inferTopic(text: string, topicKeywords: Record<string, string[]>): string {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (topic === "General Revision") continue;
    if (keywords.some((k) => lower.includes(k))) return topic;
  }
  return "General Revision";
}

export async function GET() {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const userUploads = await withRetry(() =>
      db.select().from(uploads).where(eq(uploads.userId, userId)).orderBy(uploads.createdAt)
    );

    // For each upload, fetch question count and questions with topic
    const formatted = await Promise.all(
      userUploads.map(async (u) => {
        const qs = await withRetry(() => db.select().from(questions).where(eq(questions.uploadId, u.id)));

        // fetch topics for these questions
        const topicIds = qs.map((q) => q.topicId).filter(Boolean) as string[];
        let topicMap = new Map<string, string>();
        if (topicIds.length > 0) {
          const ts = await withRetry(() =>
            db.select().from(topics).where(inArray(topics.id, topicIds))
          );
          topicMap = new Map(ts.map((t) => [t.id, t.name]));
        }

        return {
          id: u.id,
          name: u.filename,
          filename: u.filename,
          size: `${(u.fileSize / (1024 * 1024)).toFixed(1)} MB`,
          fileSize: u.fileSize,
          date: new Date(u.createdAt as any).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          createdAt: u.createdAt,
          status: u.status,
          questionCount: qs.length,
          questions: qs.map((q) => ({
            id: q.id,
            content: q.content,
            difficulty: q.difficulty,
            topic: q.topicId ? topicMap.get(q.topicId) ?? "General Revision" : "General Revision",
            topicId: q.topicId,
          })),
        };
      })
    );

    // Sort by createdAt desc (newest first) - drizzle orderBy asc earlier, so reverse
    formatted.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());

    return NextResponse.json({ uploads: formatted });
  } catch (err) {
    return apiError(err, 500, "Failed to fetch uploads");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUser();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PDF, DOCX, TXT.` },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload record with Neon HTTP
    const uploadId = genId();
    const [upload] = await withRetry(() =>
      db
        .insert(uploads)
        .values({
          id: uploadId,
          filename: file.name,
          fileSize: file.size,
          status: "PROCESSING",
          userId,
        })
        .returning()
    );

    const safeExt = (file.name.split(".").pop() ?? "").toLowerCase();
    const storageExt = ALLOWED_EXT.has(safeExt) ? safeExt : "bin";
    const storageDir = join(STORAGE_DIR, userId);
    const storagePath = join(storageDir, `${upload.id}.${storageExt}`);
    try {
      await mkdir(storageDir, { recursive: true });
      await writeFile(storagePath, buffer);
      await withRetry(() =>
        db.update(uploads).set({ storagePath }).where(eq(uploads.id, upload.id))
      );
    } catch (storageErr) {
      console.error("[Upload] Storage error (non-fatal):", storageErr);
    }

    let rawText = "";
    try {
      rawText = await extractTextFromBuffer(buffer, file.name);
    } catch (parseError) {
      await withRetry(() =>
        db.update(uploads).set({ status: "ERROR" }).where(eq(uploads.id, upload.id))
      );
      return NextResponse.json(
        { error: `Parsing error: ${(parseError as Error).message}` },
        { status: 422 }
      );
    }

    if (!rawText.trim()) {
      await withRetry(() =>
        db.update(uploads).set({ status: "ERROR" }).where(eq(uploads.id, upload.id))
      );
      return NextResponse.json({ error: "No readable text found in document" }, { status: 422 });
    }

    let parsedQuestions: Array<{ content: string; difficulty: Difficulty; topic: string }> = [];
    let embeddings: number[][] = [];

    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (hasOpenAIKey) {
      try {
        const systemPrompt = `You are an expert exam analyzer. Your task is to extract individual exam questions from the raw text of a past paper.
For each question you extract:
1. Capture the full text of the question (content).
2. Classify its difficulty level (EASY, MEDIUM, or HARD).
3. Identify its single primary topic (e.g. "Process Synchronization", "Database Normalization", "Memory Management"). Be concise and consistent with topic names.`;

        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          schema: z.object({
            questions: z.array(
              z.object({
                content: z.string().describe("The full question text"),
                difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
                topic: z.string().describe("Concise core subject topic"),
              })
            ),
          }),
          prompt: `Here is the extracted past question paper text:\n\n${rawText}`,
        });

        parsedQuestions = object.questions.map((q) => ({
          content: q.content,
          difficulty: normalizeDifficulty(q.difficulty),
          topic: q.topic.trim(),
        }));

        if (parsedQuestions.length > 0) {
          const embResult = await embedMany({
            model: openai.embedding("text-embedding-3-small"),
            values: parsedQuestions.map((q) => q.content),
          });
          embeddings = embResult.embeddings as unknown as number[][];
        }
      } catch (aiErr) {
        console.error("[Upload] OpenAI extraction failed, falling back to heuristic parser:", aiErr);
        parsedQuestions = fallbackParseQuestions(rawText);
      }
    } else {
      console.warn("[Upload] No OPENAI_API_KEY set, using fallback parser");
      parsedQuestions = fallbackParseQuestions(rawText);
    }

    if (!parsedQuestions || parsedQuestions.length === 0) {
      await withRetry(() =>
        db.update(uploads).set({ status: "COMPLETED" }).where(eq(uploads.id, upload.id))
      );
      return NextResponse.json({
        message: "File uploaded, but no questions were extracted.",
        questionCount: 0,
        uploadId: upload.id,
      });
    }

    // Ensure topics exist - upsert via onConflictDoNothing
    const uniqueTopicNames = Array.from(
      new Set(parsedQuestions.map((q) => q.topic.trim()).filter(Boolean))
    );

    if (uniqueTopicNames.length > 0) {
      const topicValues = uniqueTopicNames.map((name) => ({
        id: genId(),
        name,
      }));
      try {
        await withRetry(() =>
          db.insert(topics).values(topicValues).onConflictDoNothing({ target: topics.name })
        );
      } catch (e) {
        console.error("[Upload] Topic insert failed (may already exist):", e);
      }
    }

    const topicRecords = await withRetry(() =>
      db.select().from(topics).where(inArray(topics.name, uniqueTopicNames))
    );
    const topicIdByName = new Map(topicRecords.map((t) => [t.name, t.id]));

    // Insert questions - with embedding if available
    const questionInserts = parsedQuestions.map((q, i) => {
      const name = q.topic.trim();
      const emb = embeddings[i];
      return {
        id: genId(),
        content: q.content,
        difficulty: q.difficulty,
        topicId: topicIdByName.get(name) ?? null,
        uploadId: upload.id,
        // Drizzle custom vector type expects number[] driver will convert to "[...]"
        embedding: emb ?? null,
      };
    });

    // Batch insert - Neon HTTP supports batch but we use returning for ids
    let inserted: { id: string }[] = [];
    try {
      inserted = await withRetry(() =>
        db.insert(questions).values(questionInserts as any).returning({ id: questions.id })
      );
    } catch (e) {
      console.error("[Upload] Failed batch insert, trying individual:", e);
      // Fallback individual inserts
      inserted = [];
      for (const qi of questionInserts) {
        try {
          const [r] = await withRetry(() =>
            db.insert(questions).values(qi as any).returning({ id: questions.id })
          );
          inserted.push(r);
        } catch (ie) {
          console.error("[Upload] Individual question insert failed:", ie);
        }
      }
    }

    // If embeddings were not inserted via batch (embedding column may need raw update), try raw update as fallback
    if (inserted.length > 0 && embeddings.length === inserted.length && questionInserts[0].embedding === null) {
      // This case shouldn't happen now since we inserted embeddings directly, but keep fallback for safety
      try {
        for (let i = 0; i < inserted.length; i++) {
          const vecStr = `[${embeddings[i].join(",")}]`;
          await neonSql`UPDATE "Question" SET "embedding" = ${vecStr}::vector WHERE id = ${inserted[i].id}`;
        }
      } catch (embErr) {
        console.error("[Upload] Failed to store embeddings (non-fatal):", embErr);
      }
    }

    await withRetry(() =>
      db.update(uploads).set({ status: "COMPLETED" }).where(eq(uploads.id, upload.id))
    );

    return NextResponse.json({
      message: "File parsed and ingested successfully.",
      questionCount: parsedQuestions.length,
      uploadId: upload.id,
    });
  } catch (error) {
    return apiError(error, 500, "Failed to process file upload");
  }
}
