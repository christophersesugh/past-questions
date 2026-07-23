import { NextResponse } from "next/server";

/**
 * Returns a safe error response for API routes.
 * In production, returns a generic message; in development, includes details.
 * Always logs the full error server-side.
 */
export function apiError(
  error: unknown,
  status: number = 500,
  publicMessage?: string
): NextResponse {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log the full error server-side
  console.error(`[API Error ${status}]:`, err.message, err.stack);

  // In production, return generic messages to avoid leaking internals
  const message =
    process.env.NODE_ENV === "production"
      ? (publicMessage ?? "An unexpected error occurred. Please try again.")
      : err.message;

  return NextResponse.json({ error: message }, { status });
}
