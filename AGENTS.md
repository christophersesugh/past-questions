# past-questions — Agent Rules

This file is the bootstrap for agents working in this repo. **All project knowledge lives in MemoFS** — use MCP tools, not this file.

## MemoFS Memory (REQUIRED)

This repo uses MemoFS as its single source of truth for project knowledge.
At the **start of every task**, agents MUST:

1. **Load context** — call the MemoFS `context` tool (e.g. `memofs.context`) with the task description to load core memory, notes, and recall.
2. **Look up details** — use the MemoFS `recall` tool (e.g. `memofs.recall`) for specific lookups when context is insufficient.
3. **Adhere to memory** — follow constraints, decisions, and references returned.
4. **Persist new facts** — store discovered facts/decisions via the MemoFS `remember` tool (e.g. `memofs.remember`).

This file contains only behavioral rules and pointers — no project facts.

## Behavioral Rules


## Pointers

- Workspace rules: [./.agents/rules](./.agents/rules)
- Global skills: [~/.agents/skills/](~/.agents/skills/)
- MemoFS MCP server config (global MCP config): [~/.codex/config.toml](~/.codex/config.toml)


## Stack

- Next.js 16 (App Router, RSC) + TypeScript 5
- Tailwind CSS v4 (via `@tailwindcss/postcss`), shadcn/ui (radix-rhea style, `@/components/ui`)
- Prisma 7 with PostgreSQL (Neon). Generator outputs to `lib/generated/prisma` (gitignored)
- Package manager: pnpm

## Prisma

- `prisma.config.ts` loads `DATABASE_URL` from `.env` via `dotenv/config` (Prisma 7 convention — env vars are NOT auto-loaded)
- The app uses `.env.local` for the real Neon Postgres connection (`DATABASE_URL` there overrides `.env`)
- After schema changes: `pnpm prisma migrate dev` then `pnpm prisma generate` to update the client in `lib/generated/prisma`
- Import Prisma client from `@/lib/generated/prisma` (not `@prisma/client`)

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm lint` — ESLint (core-web-vitals + typescript rules from eslint-config-next)

## Path aliases

- `@/*` maps to project root (e.g. `@/components/ui`, `@/lib/utils`)

## shadcn/ui

- Components go in `@/components/ui/`; add via `npx shadcn add <component>`
- Utility: `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Style preset: `radix-rhea`, icons: `lucide-react`
