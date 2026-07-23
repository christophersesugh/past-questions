import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { Buffer } from "node:buffer";
// pdf-parse v2 changed its API; pin to v1 to keep the function-style call below.
import pdfParse from "pdf-parse";

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

let ocrWorkerPromise: Promise<OcrWorker> | null = null;
let ocrWorker: OcrWorker | null = null;

async function getOcrWorker(): Promise<OcrWorker> {
  if (ocrWorker) return ocrWorker;
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker("eng").then((w) => {
      ocrWorker = w;
      return w;
    });
  }
  return ocrWorkerPromise;
}

async function releaseOcrWorker(): Promise<void> {
  if (ocrWorker) {
    const w = ocrWorker;
    ocrWorker = null;
    ocrWorkerPromise = null;
    await w.terminate();
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function ocrBuffer(buffer: Buffer): Promise<string> {
  try {
    const worker = await getOcrWorker();
    const { data } = await withTimeout(
      worker.recognize(buffer),
      60_000,
      "OCR"
    );
    return data.text ?? "";
  } catch (err) {
    console.error("OCR processing error:", err);
    return "";
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  try {
    if (ext === "pdf") {
      const data = await pdfParse(buffer);
      let text = data.text || "";

      if (text.trim().length < 100) {
        // PDF text extraction yielded minimal content; falling back to OCR
        text = await ocrBuffer(buffer);
      }
      return text;
    }

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    }

    return buffer.toString("utf-8");
  } catch (error) {
    throw new Error(`Failed to parse file: ${(error as Error).message}`);
  } finally {
    if (ext !== "pdf") {
      // Keep worker warm only when OCR has been used; release for plain text/docx.
      await releaseOcrWorker();
    }
  }
}

export async function shutdownExtractor(): Promise<void> {
  await releaseOcrWorker();
}
