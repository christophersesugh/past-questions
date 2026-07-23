// @ts-nocheck
import { NextResponse } from "next/server";
import { testDbConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; latencyMs?: number }> = {};

  // DB check via Neon HTTP
  const dbStart = Date.now();
  try {
    const result = await testDbConnection();
    checks.database = {
      ok: result.ok,
      error: result.error,
      latencyMs: Date.now() - dbStart,
    };
  } catch (e) {
    checks.database = {
      ok: false,
      error: (e as Error).message,
      latencyMs: Date.now() - dbStart,
    };
  }

  // OpenAI key check (internal, not user-facing)
  checks.openai = {
    ok: !!process.env.OPENAI_API_KEY,
    error: !process.env.OPENAI_API_KEY ? "AI features running in standard mode" : undefined,
  };

  // Env check
  checks.env = {
    ok: !!process.env.DATABASE_URL && !!process.env.AUTH_SECRET,
    error: !process.env.DATABASE_URL
      ? "DATABASE_URL missing"
      : !process.env.AUTH_SECRET
      ? "AUTH_SECRET missing"
      : undefined,
  };

  checks.driver = {
    ok: true,
    error: undefined,
    // @ts-ignore add driver info
    latencyMs: undefined,
  } as any;

  const allOk = checks.database.ok && checks.env.ok;

  return NextResponse.json(
    {
      status: allOk ? "ok" : checks.database.ok ? "degraded" : "error",
      timestamp: new Date().toISOString(),
      driver: "neon-http + drizzle (fetch, not TCP 5432)",
      checks,
      guidance: !checks.database.ok
        ? {
            issue: "Database connection failed",
            possibleCauses: [
              "Neon free tier auto-pauses after 5 minutes - HTTP driver auto-wakes but first request may be slow",
              "DATABASE_URL invalid or project deleted - check https://console.neon.tech",
              "Network blocking fetch to Neon endpoint",
            ],
            fixes: [
              "Neon HTTP driver uses fetch not port 5432 - retry after 2s should succeed",
              "Verify DATABASE_URL in .env.local is valid pooled Neon URL",
              "If still failing, create new Neon project and update DATABASE_URL",
              "App still builds without DB but auth/upload will return 503 with helpful message",
            ],
          }
        : undefined,
    },
    { status: allOk ? 200 : checks.database.ok ? 200 : 503 }
  );
}
