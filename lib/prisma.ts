/**
 * Legacy shim - project now uses Drizzle + Neon HTTP driver (lib/db).
 * This file is kept for backwards compatibility during migration.
 * New code should import from '@/lib/db' directly.
 */

export { db as prisma, db, withRetry, testDbConnection, neonSql } from "./db/index";
export * from "./db/schema";

// For any remaining code expecting prisma.$queryRaw etc, provide stubs that use neonSql
import { neonSql } from "./db/index";

export const prismaLegacyHelpers = {
  $queryRaw: (strings: TemplateStringsArray, ...values: any[]) => {
    // @ts-ignore - adapt tagged template to neonSql
    return (neonSql as any)(strings, ...values);
  },
  $queryRawUnsafe: async (query: string, ...params: any[]) => {
    // Use neonSql for unsafe queries - interpolate cautiously
    // For migration period, we convert $1, $2 placeholders to actual values via raw query
    // This is simplified - prefer neonSql template usage
    return neonSql.unsafe ? (neonSql as any).unsafe(query, params) : neonSql`${query}`;
  },
};
