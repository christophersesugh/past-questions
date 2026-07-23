import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// For edge runtime fetching optimization - fetch cache is now always enabled in neon driver v1.1+
// neonConfig settings deprecated, using defaults which are optimal for Vercel + Drizzle

function sanitizeConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url.replace(/channel_binding=[^&]+&?/g, "").replace(/&&+/g, "&").replace(/\?&/, "?").replace(/[?&]$/, "");
  }
}

// Prefer pooled for app runtime, neon-http works with either but pooled is better
const rawUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

const connectionString = sanitizeConnectionString(rawUrl);

if (!connectionString && process.env.NODE_ENV !== "production") {
  console.warn("[DB] No DATABASE_URL set — DB operations will fail. Set DATABASE_URL in .env.local");
}

// neon() creates a Tagged template function that uses fetch, not TCP
// This means it works even if port 5432 is blocked, and auto-wakes paused Neon
const sql = connectionString ? neon(connectionString) : (null as any);

export const db = sql
  ? drizzle(sql as any, { schema })
  : // Mock that throws helpful error if called without DB configured
    (new Proxy({} as any, {
        get(_, prop) {
          if (prop === "then") return undefined;
          return () => {
            throw new Error(
              "Database not configured. Set DATABASE_URL in .env.local. If using Neon HTTP driver, ensure URL is valid."
            );
          };
        },
      }) as any);

// Raw SQL client for cases where we need direct queries (vector search, custom)
export { sql as neonSql };

// Helper for retry logic (Neon wake-up can take few seconds)
// T defaults to any to allow drizzle query builders that are thenable but not Promise<T> typed
export async function withRetry<T = any>(fn: () => T | Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message || "";
      const isConnError =
        msg.toLowerCase().includes("fetch failed") ||
        msg.includes("closed the connection") ||
        msg.includes("Can't reach") ||
        msg.includes("Connection terminated") ||
        msg.includes("timeout") ||
        msg.toLowerCase().includes("neon") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("network");

      if (!isConnError || i === retries) throw e;
      console.warn(`[DB] Connection error, retrying (${i + 1}/${retries}): ${msg}`);
      await new Promise((r) => setTimeout(r, 700 * (i + 1) + Math.random() * 300));
    }
  }
  throw lastErr;
}

export async function testDbConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!sql) return { ok: false, error: "DATABASE_URL not set" };
    // simple query using fetch-based client
    await sql`SELECT 1 as ok`;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Re-export schema
export * from "./schema";
