// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, withRetry } from "@/lib/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

function genId(): string {
  // cuid-compatible length random id using crypto - simple for Drizzle
  return randomUUID().replace(/-/g, "").slice(0, 24);
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    let existing;
    try {
      existing = await withRetry(async () => {
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return rows[0] || null;
      });
    } catch (dbErr) {
      console.error("[Register] DB check failed:", dbErr);
      return NextResponse.json(
        {
          error:
            "Database connection failed via Neon HTTP. Please check DATABASE_URL and retry. Neon auto-wakes on HTTP request.",
          details: (dbErr as Error).message,
        },
        { status: 503 }
      );
    }

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    let created;
    try {
      created = await withRetry(async () => {
        const id = genId();
        const [row] = await db
          .insert(users)
          .values({
            id,
            name,
            email,
            password: hashed,
          })
          .returning({ id: users.id, name: users.name, email: users.email });
        return row;
      });
    } catch (dbErr) {
      console.error("[Register] DB create failed:", dbErr);
      return NextResponse.json(
        {
          error: "Failed to create account due to database issue. Please retry.",
          details: (dbErr as Error).message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ user: created, message: "Account created" }, { status: 201 });
  } catch (error) {
    return apiError(error, 500, "Failed to create account");
  }
}
