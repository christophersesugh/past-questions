import { defineConfig } from "drizzle-kit";

function sanitize(url: string | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url.replace(/channel_binding=[^&]+&?/g, "").replace(/&&+/g, "&").replace(/\?&/, "?").replace(/[?&]$/, "");
  }
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: sanitize(
      process.env.DATABASE_URL_UNPOOLED ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        ""
    ),
  },
  verbose: true,
  strict: true,
});
