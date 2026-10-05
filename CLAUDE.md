# Blueprint — context for coding agents

Blueprint (working title; one constant, `APP_NAME` in `src/config/app.ts`) is a private web app that turns a vague product idea into a build-ready specification, and then into instructions an AI coding agent can execute. A conversational "Architect" interviews the user and edits a structured **Project Brain**. The Brain, not the chat, is the source of truth.

## Read first

- `docs/MVP-SPEC.md` — the authoritative spec (scope, schemas, rules, UI, acceptance).
- `docs/PHASES.md` — one prompt per build phase. Work only on the phase you were given.
- `docs/PROGRESS.md` — running log that you maintain: done, decisions, assumptions, open questions.

## Hard rules

1. **The spec is the source of truth.** Do not invent product behavior. If the spec is silent, take the simplest option, log it under "Assumptions" in `docs/PROGRESS.md`, and continue. Stop and ask only for security, data-loss, or irreversible decisions.
2. **Stay in the phase.** Build nothing from later phases or from the OUT list (spec §2.2).
3. **Layering (enforced by lint):** `components` → `app/` (route handlers, server actions) → `server/ai` → `server/brain`. Within `src/`, `server/db` is the only module that imports Supabase (scripts may use supabase-js directly). `server/brain` and `server/outputs` are pure TypeScript: no React, no Supabase, no `server/ai` imports, no clock or randomness (inject `now` and ids). Client components may import only `server/brain` (types, schemas, pure functions), `src/lib` and `src/config/app.ts`.
4. **One write path.** Only `applyOps()` produces a new Brain, and only the `commit_brain` RPC persists it. Nothing else writes `projects.brain`.
5. **Validate every boundary with Zod:** HTTP bodies, env vars, LLM output. LLM output is untrusted input.
6. **Secrets stay server-side.** Modules that read secrets import `server-only`. Never log keys, and never log prompts or user text at info level.
7. **No hardcoded demo numbers or fake data in product paths.** Demo data lives only in `scripts/seed-demo.ts` and `tests/fixtures/`.
8. **TypeScript strict.** No `any` (use `unknown` + Zod). No `@ts-ignore` without a reason in a comment.
9. **Don't rely on memory for library APIs or versions.** Install the latest stable release and read the official docs for the installed version (Next.js, Supabase SSR auth, Tailwind, shadcn/ui, Zod, AI SDK).

## Commands

Package manager: npm. Scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`, `format`, `check` (typecheck + lint + test). Phase 1 adds `db:push` and `db:types`; Phase 7 adds `eval`.

## Definition of done (every phase)

- `npm run check` passes.
- Every item in the phase's acceptance checklist is ticked with the evidence you used (command output, test name, or manual step).
- `docs/PROGRESS.md` is updated.
- Small commits, message format `phaseN: <what>`.

## Conventions

- UI language is English. Keep strings together per feature so they can be translated later (no i18n library yet).
- IDs the user sees are Brain keys (`REQ-004`), rendered in the mono font.
- Timestamps are stored in UTC and displayed in the browser's locale.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
