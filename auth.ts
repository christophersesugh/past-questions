import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, withRetry, neonSql } from "@/lib/db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter needed for credentials-only flow; JWT strategy stores minimal data
  // This eliminates Prisma dependency and works with Neon HTTP driver
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        try {
          const result = await withRetry(async () => {
            // Drizzle query - works with Neon HTTP (fetch, not TCP)
            const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
            return rows[0] || null;
          });

          if (!result) return null;

          const passwordsMatch = await bcrypt.compare(password, result.password);
          if (passwordsMatch) {
            return {
              id: result.id,
              name: result.name,
              email: result.email,
            };
          }
        } catch (err) {
          console.error("[Auth] DB error during authorize:", err);
          // Surface DB error as auth error to show in UI
          throw new Error(
            "Database connection failed. Neon HTTP will auto-wake, please wait 3s and retry."
          );
        }

        return null;
      },
    }),
  ],
});
