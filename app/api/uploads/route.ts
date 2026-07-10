import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromBuffer } from "@/lib/extractor";
import { generateObject, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { UploadStatus, Difficulty } from "@/lib/generated/prisma/enums";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const maxDuration = 60; // Extend Next.js timeout for processing large files/OCR

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const ALLOWED_EXT = new Set(["pdf", "docx", "txt"]);
const STORAGE_DIR = process.env.UPLOAD_STORAGE_DIR ?? join(process.cwd(), ".uploads");

function normalizeDifficulty(value: string): Difficulty {
  if (value === "EASY" || value === "MEDIUM" || value === "HARD") return value;
  return Difficulty.MEDIUM;
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

    const upload = await prisma.upload.create({
      data: {
        filename: file.name,
        fileSize: file.size,
        status: UploadStatus.PROCESSING,
        userId,
      },
    });

    // Persist the original file to disk for re-processing / audit
    const safeExt = (file.name.split(".").pop() ?? "").toLowerCase();
    const storageExt = ALLOWED_EXT.has(safeExt) ? safeExt : "bin";
    const storageDir = join(STORAGE_DIR, userId);
    const storagePath = join(storageDir, `${upload.id}.${storageExt}`);
    try {
      await mkdir(storageDir, { recursive: true });
      await writeFile(storagePath, buffer);
      await prisma.upload.update({
        where: { id: upload.id },
        data: { storagePath },
      });
    } catch (storageErr) {
      console.error("Failed to persist upload to disk:", storageErr);
      // Non-fatal: continue with extraction so user can re-parse the document.
    }

    let rawText = "";
    try {
      rawText = await extractTextFromBuffer(buffer, file.name);
    } catch (parseError) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: UploadStatus.ERROR },
      });
      return NextResponse.json(
        { error: `Parsing error: ${(parseError as Error).message}` },
        { status: 422 }
      );
    }

    if (!rawText.trim()) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: UploadStatus.ERROR },
      });
      return NextResponse.json(
        { error: "No readable text found in document" },
        { status: 422 }
      );
    }

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

    const parsedQuestions = object.questions;

    if (!parsedQuestions || parsedQuestions.length === 0) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: UploadStatus.COMPLETED },
      });
      return NextResponse.json({
        message: "File uploaded, but no questions were extracted.",
        questionCount: 0,
      });
    }

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: parsedQuestions.map((q) => q.content),
    });

    const uniqueTopicNames = Array.from(
      new Set(parsedQuestions.map((q) => q.topic.trim()))
    );
    await prisma.$transaction(
      uniqueTopicNames.map((name) =>
        prisma.topic.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    const topicRecords = await prisma.topic.findMany({
      where: { name: { in: uniqueTopicNames } },
      select: { id: true, name: true },
    });
    const topicIdByName = new Map(topicRecords.map((t) => [t.name, t.id]));

    const inserted = await prisma.$transaction(
      parsedQuestions.map((q) => {
        const name = q.topic.trim();
        return prisma.question.create({
          data: {
            content: q.content,
            difficulty: normalizeDifficulty(q.difficulty),
            topicId: topicIdByName.get(name) ?? null,
            uploadId: upload.id,
          },
          select: { id: true },
        });
      })
    );

    if (inserted.length > 0) {
      const values: string[] = [];
      const params: string[] = [];
      inserted.forEach((row, i) => {
        const vecPlaceholder = `$${i * 2 + 1}::vector`;
        const idPlaceholder = `$${i * 2 + 2}`;
        values.push(`(${vecPlaceholder}, ${idPlaceholder})`);
        params.push(`[${embeddings[i].join(",")}]`, row.id);
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "Question" q SET "embedding" = v.embedding
         FROM (VALUES ${values.join(",")}) AS v(embedding, id)
         WHERE q.id = v.id`,
        ...params
      );
    }

    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: UploadStatus.COMPLETED },
    });

    return NextResponse.json({
      message: "File parsed and ingested successfully.",
      questionCount: parsedQuestions.length,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
