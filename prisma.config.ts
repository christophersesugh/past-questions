import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { defineConfig } from "prisma/config";

const url = process.env["DATABASE_URL_UNPOOLED"] || process.env["POSTGRES_PRISMA_URL"] || process.env["DATABASE_URL"];
console.log("Resolved Database Host:", url ? url.split("@")[1] : "UNDEFINED");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
