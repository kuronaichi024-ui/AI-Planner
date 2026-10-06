# Blueprint — Phase prompts

One prompt per build phase. Paste **one block per fresh agent session** (Claude Code, Cursor, Codex, or similar), in order. Each prompt points the agent at `CLAUDE.md` and `docs/MVP-SPEC.md`, so those files must be in the repo first.

**Rhythm for every phase:** run the phase prompt → commit → run the REVIEW prompt (bottom of this file) in a _new_ session, ideally with a different model, so the work is not graded by its author → fix → next phase.

---

## Prerequisites (manual, once)

1. Install Node.js (current LTS), npm and git. Create an empty repo.
2. Put these files in the repo: `CLAUDE.md` (copy it to `AGENTS.md` for tools that read that name), `docs/MVP-SPEC.md`, `docs/PHASES.md`.
3. Create a Supabase project (the free tier is fine). Note the Project URL and the publishable key (`sb_publishable_…`; on an older project the legacy anon key works in the same place, but Supabase is moving projects to publishable keys, so prefer that one). In Auth settings enable the Email provider and, while developing, turn off "Confirm email".
4. Install the Supabase CLI. In Phase 1 you will run `supabase login` and `supabase link --project-ref <ref>` (keep your database password handy).
5. Create two test users (A and B) in the Supabase dashboard for the RLS check.
6. Pick an AI provider and create an API key (Anthropic or OpenAI). Until you have one, use `AI_PROVIDER=mock`.
7. After Phase 0, create `.env.local` from `.env.example`. Never commit it.

## At a glance

| Phase                      | Outcome                                                  | Needs         |
| -------------------------- | -------------------------------------------------------- | ------------- |
| 0 Foundation               | App shell, design tokens, tooling, lint guardrails       | Prerequisites |
| 1 Database, auth, projects | Sign in, create/list/open projects, RLS, workspace shell | 0             |
| 2 Brain domain             | Schemas, applyOps, classifyOps, readiness, digest, repo  | 1             |
| 3 AI orchestration         | Providers, interview turn pipeline, API routes           | 2             |
| 4 Architect panel          | Chat, question cards, proposal review                    | 3             |
| 5 Workspace views          | Overview, readiness, attention, item sections            | 4             |
| 6 Outputs                  | Build plan, PRD, AI coding prompt                        | 5             |
| 7 Hardening                | Security checks, evals, README                           | 6             |
| 8 Landing (optional)       | Marketing page with animated transformation              | 1             |

---

## Phase 0 — Foundation

```text
You are implementing PHASE 0 — Foundation of the Blueprint MVP.

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §3, §9.4, §12. Create docs/PROGRESS.md if it does not exist.

GOAL
A running Next.js app shell with tooling, design tokens and guardrails. No product features, no database, no auth.

TASKS
1. Scaffold Next.js (App Router, TypeScript strict, Tailwind, ESLint, `src/` directory, alias `@/*`) with npm. Install the latest stable versions and read the docs for what you installed.
2. Initialize shadcn/ui and add: button, input, textarea, label, dialog, sheet, tabs, badge, dropdown-menu, tooltip, skeleton, sonner, scroll-area, separator, checkbox, radio-group, select, table.
3. Implement the design tokens from §9.4: CSS variables for light and dark, Tailwind theme mapping, Inter and JetBrains Mono via next/font, next-themes with a theme toggle, compact density (base 14px).
4. Build `/styleguide` (404 in production) showing: color tokens, type scale, buttons, provenance chips (USER, AI-INFERRED, AI-RECOMMENDED, PROPOSED, OPEN), an item-list row, a dialog, a skeleton, and an empty state, in both themes.
5. Config: `src/config/app.ts` (APP_NAME = "Blueprint"), `src/config/env.ts` (Zod-validated server and client env per §12; fail fast with a readable message; `server-only` on the server part), and `.env.example` with every variable in §12.
6. Tooling: Prettier; Vitest (Testing Library, jsdom) with one sample test; Playwright config (no tests yet); npm scripts: dev, build, typecheck, lint, test, test:e2e, format, check (= typecheck + lint + test).
7. Guardrails: ESLint `no-restricted-imports` overrides that implement the layering in §3.2 (brain and outputs are pure; within `src/` only `server/db` imports `@supabase/*`; client components may import only `server/brain`, `src/lib` and `src/config/app.ts`).
8. Create the empty module skeleton `src/server/{db,brain,ai,outputs}/index.ts`, each with a one-paragraph comment stating its responsibility.
9. Root layout, 404 and error pages in the design system. `/` temporarily shows APP_NAME and, in development, a link to /styleguide.
10. Write docs/PROGRESS.md (sections: Done, Decisions, Assumptions, Open questions) and fill in the Commands section of CLAUDE.md.

CONSTRAINTS
- No auth, database, AI or feature code. No dependency you do not use.
- No hardcoded colors in components; use tokens.

ACCEPTANCE CHECKLIST
- [ ] `npm run dev` serves `/`; `/styleguide` renders correctly in light and dark
- [ ] `npm run check` passes from a clean clone (`npm ci` first)
- [ ] A missing required env var produces a clear startup error naming the variable
- [ ] Lint fails if `src/server/brain` imports from `src/server/ai` (prove it with a temporary offending import, then remove it)
- [ ] Lint fails if a file under `src/components` imports `src/server/db` (prove it the same way)
- [ ] Text/background token pairs meet WCAG AA (state how you checked)
- [ ] The Commands section of CLAUDE.md matches the real scripts

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 1 — Database, auth, projects

```text
You are implementing PHASE 1 — Database, auth, and projects.

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §4.1, §5 and §5.1, §9.1–9.3 (dashboard, new project), §9.5, §10. Check docs/PROGRESS.md.

GOAL
A signed-in user can create, list, open, rename and delete their own projects, and nobody else can see them. The workspace is an empty shell.

TASKS
1. Supabase access, all inside `src/server/db`: the server client (cookies) and the session-refresh helper used by the Next.js middleware (the file convention is `middleware` up to Next.js 15 and `proxy` from 16; use the one your installed version expects). There is no browser-side Supabase client. Follow the official Next.js SSR auth guide for the installed versions. Within `src/`, only `src/server/db` imports `@supabase/*`.
2. Migration `supabase/migrations/0001_init.sql`: every table, check constraint, index, the `updated_at` trigger, RLS policies, and the `commit_brain` function exactly as specified in §5 and §5.1. `projects.brain` defaults to the empty Brain (§4.1).
3. Apply it with the Supabase CLI (`supabase link`, `supabase db push`). Add `db:push` and `db:types` scripts and commit the generated types.
4. Auth through server actions (no browser client): `/login` and `/signup` (email + password), sign-out, middleware protecting `/projects/**`, redirects (a signed-in user visiting /login goes to /projects).
5. `/projects`: time-of-day greeting, project cards (name, readiness score, requirement and feature counts from `projects.counts`, relative updated time), "+ New project", empty state.
6. `/projects/new`: one large textarea "What do you want to build?" and a "Start Planning" button (min 10, max 8,000 characters). Create the project (name = first 60 characters of the idea, trimmed), store `idea_text`, redirect to `/projects/[id]`.
7. Workspace shell at `/projects/[id]`: three-pane layout (§9.2); left nav with every section (sections not built yet show a "Coming in a later phase" empty state); header with editable project name and a readiness chip that shows an em dash for now; right Architect panel as an empty placeholder. Mobile: nav drawer and bottom sheet (§9.5).
8. Rename and delete project. Delete asks the user to type the project name.
9. `scripts/verify-rls.ts`: using the TEST_USER_* credentials from env, assert that user B cannot select, update or delete user A's rows in every table. Document how to run it.
10. Tests: unit tests for validators and helpers; one Playwright test: sign up → create project → see it in /projects → open the workspace.

CONSTRAINTS
- Use only the user-scoped client; never the service_role key.
- A project that is not yours returns 404 (not 403).
- Zod-validate all inputs; no business logic in components.

ACCEPTANCE CHECKLIST
- [ ] The migration applies cleanly on a fresh Supabase project; the `db:types` output is committed
- [ ] `verify-rls` passes for every table (paste the output)
- [ ] Signed-out access to `/projects` redirects to `/login`
- [ ] Create → list → rename → delete works, and deleting a project removes its dependent rows
- [ ] The workspace shell is usable at 375px, 768px and 1280px widths
- [ ] `npm run check` and the e2e test pass

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 2 — Project Brain domain

```text
You are implementing PHASE 2 — the Project Brain domain (pure TypeScript: no AI, no UI).

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §4, §6.5, §7, §11. Check docs/PROGRESS.md.

GOAL
The complete, tested domain layer: schemas, key allocation, applyOps, classifyOps, readiness, digest, and the persistence helpers.

TASKS
1. `server/brain/schemas.ts`: Zod schemas for every item type, Item, Link, Brain and Op (strict objects, no unknown keys), the enums, and the link-rules matrix as typed constants (§4.2–4.3). Export the inferred types.
2. `server/brain/keys.ts`: the prefix map and `allocateKey` (monotonic counters, keys never reused).
3. `server/brain/apply.ts`: pure `applyOps(brain, ops, ctx)` with temp refs (@n), per-op results carrying the error codes in §4.5, link-cascade on delete, cycle detection for `depends_on`, protected confirmed items, vision singleton, tombstone revival (§4.4), deep-merge update with re-validation.
4. `server/brain/classify.ts`: `verifyEvidence` (normalization per §4.4) and `classifyOps` returning auto, review and downgraded as in §4.5.
5. `server/brain/select.ts`: `selectOps(ops, selectedOpIds)` (drops ops that reference deselected temp refs), `makeTombstones(brain, rejectedCreateOps, ctx)`, and `previewApply(brain, ops)` returning the hypothetical Brain for potential readiness.
6. `server/brain/readiness.ts`: `computeReadiness(brain, openInsights)` implementing §7 exactly: checks, weights, penalties, labels, and the cap at 84 while a blocking insight is open. Every failing check has a human-readable `label` and `hint`.
7. `server/brain/digest.ts`: `buildDigest(brain, opts)` with the three degradation levels and a token estimator (chars / 4).
8. `server/db/brain-repo.ts`: `loadProject`, `commitBrain` (calls the `commit_brain` RPC with the full parameter list in §5.1 and maps `REVISION_CONFLICT` to a typed error), `listOpenInsights`, `appendMessage`. This is the only place that reads or writes Brain data in Supabase.
9. `tests/fixtures/tutor-brain.ts`: a complete hand-written Brain for a tutor marketplace, labelled DEMO. `scripts/seed-demo.ts`: signs in with the TEST_USER_A credentials and inserts it as a project named "Tutor Marketplace (DEMO)".
10. Unit tests (target at least 40): apply (create, update, delete, link, temp refs, singleton, duplicates, tombstone revival, cycles, protected items), classify (verified, failed, downgrade, links following their endpoints), select and tombstones, readiness (every check passing and failing, zero-X checks fail, penalties, label thresholds, cap), digest (levels respect the budget and always include keys).

CONSTRAINTS
- `server/brain` imports nothing from React, Supabase or `server/ai`. No I/O. No `Date.now()` or randomness inside pure functions (inject `now` and ids through ctx).
- Readiness is always computed, never stored as a literal.

ACCEPTANCE CHECKLIST
- [ ] Coverage of `server/brain` is at least 85% of lines (paste the report)
- [ ] The fixture Brain's readiness equals an expected value asserted in a test, with the expected computation written out in a comment
- [ ] The lint layering rules pass
- [ ] Seeding the demo project works, and `projects.readiness_score` and `counts` are set by the commit
- [ ] `REVISION_CONFLICT` is reproduced in a test (two commits with the same expected revision)
- [ ] `npm run check` passes

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 3 — AI orchestration

```text
You are implementing PHASE 3 — AI orchestration.

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §6 (all), §5.1, §10, §12. Check docs/PROGRESS.md.

GOAL
`runInterviewTurn` works end to end behind `POST /api/ai/turn`, using the Mock provider by default and a real provider when configured. No UI yet.

TASKS
1. `server/ai/provider.ts`: the `LLMProvider` interface and the typed errors (§6.1).
2. `server/ai/providers/mock.ts`: scripted, deterministic provider that loads fixtures from `tests/fixtures/ai-turns/` and supports failure injection (invalid_json, schema_violation, timeout, rate_limit). Create fixtures for: first-turn analysis of the tutor idea; an answer turn; an ambiguity turn ("The app should be fast."); a contradiction turn.
3. Real adapters in `server/ai/providers/` for Anthropic and OpenAI. Read the current official docs (and the AI SDK docs if you use it) for structured output. Model IDs come from env per job (§12); none in code. A registry selects the provider from `AI_PROVIDER`.
4. `server/ai/config.ts`: job configuration (§6.1).
5. `server/ai/schemas.ts`: Zod schemas for AiTurn, Question and Insight (§6.2), reusing `Op` from the brain.
6. `server/ai/prompts/`: `interview.ts` encodes every rule in §6.4 as a numbered list inside the system prompt, plus the first-turn addendum for `analyze_idea`. `context.ts` assembles system prompt, digest, open insights, failing checks, tombstones, the last 8 messages and the new input, wrapping all user text in clearly delimited blocks and stating that it is data.
7. `server/ai/turn.ts`: `runInterviewTurn` implementing §6.3 steps 1–11: the single repair attempt, tombstone filtering, insight dedupe, `ai_usage` rows (also on failure), `ai_turn_failed` events, and one REVISION_CONFLICT retry. For `analyze_idea`, the project's `idea_text` becomes the first user message (§6.2).
8. `app/api/ai/turn/route.ts`: auth, Zod input (`TurnInput`, §6.2), DB-backed rate limit (§10), typed error → HTTP mapping (§6.6), JSON `TurnResult`. No streaming.
9. `server/ai/accept.ts` and `app/api/projects/[id]/proposals/[proposalId]/route.ts`: accept (selected opIds) and reject, writing tombstones for rejected creates and committing through `commit_brain` with `p_decide_proposal`.
10. `scripts/ai-turn.ts`: a CLI that signs in with the TEST_USER_A credentials, runs one turn against a project and prints the result.
11. Tests (Vitest with the MockProvider): happy path (user-sourced items auto-applied, proposal stored, insights stored, potential readiness computed); invalid output then repair succeeds; invalid twice leaves the Brain unchanged and returns a typed error; evidence downgrade; a rejected tombstone is not re-proposed; rate limit; revision-conflict retry; hostile output (deletes of confirmed user items are never auto-applied; more than 60 ops, unknown keys and task ops are rejected) is handled; a proposed update of a confirmed item reaches the proposal and is not dropped as PROTECTED_ITEM; a tombstone is revived only with verified user evidence; secrets never appear in logs or responses.

CONSTRAINTS
- The AI layer writes Brain data only through `commitBrain`. Usage rows and failure events go through `server/db` helpers you add in this phase (usage log, rate-limit count, messages, proposals, failure events); there are no Supabase calls outside `server/db`.
- Provider output is `unknown` until it has been parsed with Zod.
- Do not log prompts or user text at info level.

ACCEPTANCE CHECKLIST
- [ ] With `AI_PROVIDER=mock`, `scripts/ai-turn.ts` on a fresh project yields at least 1 auto-applied item with verified evidence, a pending proposal with at least 8 ops, and at most 3 questions
- [ ] All failure-mode tests pass, and the Brain revision is unchanged after a failed turn
- [ ] With a real key, one manual turn on the tutor idea returns a schema-valid result (paste a summary, never secrets)
- [ ] A search of the source finds no model IDs or API keys
- [ ] `npm run check` passes

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 4 — Architect panel

```text
You are implementing PHASE 4 — the Architect panel (chat, questions, proposals).

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §6.2–6.3, §6.7, §9.2–9.5. Check docs/PROGRESS.md.

GOAL
The user can talk to the Architect, answer structured questions, and review and accept proposals, all inside the workspace's right panel.

TASKS
1. Architect panel: message list (user and assistant), composer (Enter sends, Shift+Enter newline, 8,000-character counter), sending state, an error card with Retry that preserves the message (use `retryMessageId`), and `aria-live="polite"` for new assistant messages. Load history from `messages`.
2. Question cards rendered from the insight rows linked to an assistant message: single (radio), multi (checkbox), text, and an "Other…" input when allowed. Submitting posts structured `answers` to `/api/ai/turn`; an answered card collapses to a summary of the choice.
3. Proposals card: "Proposed changes (n)" grouped by item type; each row shows type chip, title, reason, confidence and the evidence quote if any; checkboxes checked by default; "Accept selected" and "Reject all"; after a decision the card shows the outcome. Wire it to the Phase 3 endpoint, then refresh Brain data (counts, readiness).
4. "Applied automatically (n)" collapsible block listing user-sourced items with their evidence quotes.
5. Insight chips (ambiguity, contradiction, missing, risk) in assistant messages that deep-link to the attention list (built in Phase 5; a placeholder target is fine for now).
6. New project flow: after "Start Planning", create the project and call the first turn with intent `analyze_idea`. Show the staged state "Reading your idea…" with elapsed seconds (no fake progress bar). On failure show a retry card on the Overview.
7. Mobile: the panel becomes a bottom sheet opened by a floating button with a badge counting pending proposals plus open questions.
8. Proper empty, loading and error states. Use the shared provenance chip from Phase 0.
9. Tests: component tests for QuestionCard and ProposalCard (selection logic and the structured payload shape); Playwright with the MockProvider: create a project from an idea → proposals appear → accept all → answer a question → a follow-up assistant message appears.

CONSTRAINTS
- The UI never edits the Brain directly; it only calls the Phase 3 endpoints.
- Do not invent endpoints beyond §6.7.
- Every number shown (counts, confidence) comes from data.

ACCEPTANCE CHECKLIST
- [ ] Steps 1–5 of §13 work end to end with the MockProvider
- [ ] Partial acceptance works: two deselected ops are not applied and are not re-proposed
- [ ] Answers are sent as structured data, not rewritten sentences (show the request payload)
- [ ] A failed turn shows a retry card and loses no text
- [ ] The panel is usable by keyboard alone, and new assistant messages are announced to screen readers
- [ ] `npm run check` and the e2e test pass

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 5 — Workspace views

```text
You are implementing PHASE 5 — Workspace views (Overview, readiness, attention, item sections).

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §4, §6.7, §7, §9.3–9.5. Check docs/PROGRESS.md.

GOAL
The user can see and manage everything the Architect has built: readiness, what needs attention, and every item type.

TASKS
1. Overview page: the magic-moment panel (derived from the pending proposal and from readiness and potential readiness; dismissible), the readiness panel (number, label, per-category bars with passed/total, the sentence "Your project is N% build-ready."), the "N things need attention" list (failing checks plus open insights, sorted per §7, top 5 and "Show all") with "Resolve with AI" (sends the top 3 as `focus` to /api/ai/turn), and editable vision and goals.
2. Header readiness chip and left-nav counts from live data.
3. Insights UI: contradiction card (both items side by side with Keep A, Keep B, Define new rule), ambiguity/missing/question cards (options plus other), risk cards (Acknowledge via the `dismissInsight` action in §6.7, Ask the Architect). Resolving posts structured answers and runs a turn.
4. A generic `ItemTable` and `ItemDialog` driven by an `ITEM_UI` config for every item type except task. Build reusable field editors: text, textarea, select, string-list, entity-fields editor, states editor. Table: key (mono), title, provenance chip, priority chip if any, link count; filters for provenance, confirmed/rejected and text search. Dialog: fields, provenance block (source, reason, confidence, evidence), outgoing and incoming links with titles, Edit, Delete, "Ask the Architect about this". The Overview reuses the same dialog for vision and goals.
5. Implement the `applyUserOps` server action (§6.7) and use it for every edit and delete (actor user, evidence "[manual]", source user). On REVISION_CONFLICT reload and reapply once, otherwise ask the user to retry.
6. Decisions page with Decisions and Assumptions tabs.
7. Empty, loading and error states on every page; responsive behavior (stacked rows on mobile, full-screen dialogs).
8. Tests: component tests for the readiness panel and ItemDialog validation; Playwright with the MockProvider: resolve an ambiguity and a contradiction and watch readiness change; edit a requirement and see its provenance flip to USER.

CONSTRAINTS
- One generic table and dialog system; no per-type page components beyond config.
- Use the Zod schemas from `server/brain` for form validation; do not duplicate rules.

ACCEPTANCE CHECKLIST
- [ ] The seeded demo project renders every section correctly and is clearly labelled DEMO
- [ ] Readiness panel numbers match `computeReadiness` (asserted in a test)
- [ ] Resolving a blocking contradiction removes its penalty and updates the header chip (§13 steps 6–7)
- [ ] Editing an AI item makes it USER with evidence "[manual]"; a concurrent edit triggers the conflict path
- [ ] No hardcoded figures in UI code (search for literals such as "86%")
- [ ] `npm run check` and the e2e test pass

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 6 — Outputs

```text
You are implementing PHASE 6 — Outputs (build plan, PRD, AI coding prompt).

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §8, §6.2 (PlanTurn, SummaryTurn), §6.7, §9.3 (output pages), §10, §11. Check docs/PROGRESS.md.

GOAL
From a confirmed Brain the user can generate a validated build plan, a PRD, and AI coding prompts for four agents, then copy or download them.

TASKS
1. `server/ai/plan.ts`: job `plan` using the prompt rules in §8.1, the `PlanTurn` schema, one repair attempt, and the validators V1–V5 from `server/outputs/plan-validators.ts` (pure). Apply as a single commit that replaces all tasks (`{ actor: 'ai', userApproved: true }`). Add MockProvider fixtures for the `plan` and `summary` jobs and one invalid plan for the repair path; let the mock derive the plan from the Brain digest in the request (for example one task per `must` requirement, linked by key) so keys are never hardcoded.
2. `app/api/projects/[id]/generate/{plan,prd,agent-prompt}/route.ts` (§6.7): auth and typed errors on all three. The generation rate-limit bucket applies to `plan` and `prd` (they call the AI); `agent-prompt` is deterministic and renders all four variants in one call, storing one `exports` row per variant (§8.4).
3. `server/outputs/prd.ts`: the deterministic renderer (§8.2) plus job `summary` for the overview paragraph, with a deterministic fallback.
4. `server/outputs/agent-prompt.ts`: the deterministic renderer (§8.3) with variants `generic`, `claude_code`, `cursor`, `codex`; implementation order from a topological sort of task dependencies within phases; an OPEN QUESTIONS section built from open insights and failing readiness checks.
5. Build plan page (§9.3): progress, phases grouped, task state selector (Todo, In progress, Done, Blocked; changes go through `applyUserOps`), dependency display, task dialog, Generate/Regenerate with a confirm dialog showing how many tasks are not `todo`, and "Copy plan as Markdown".
6. PRD page and AI coding prompt page: sanitized Markdown preview (react-markdown with rehype-sanitize, no raw HTML), variant tabs, "Copy for Claude Code / Cursor / Codex", "Download Markdown" (`<project-slug>-<kind>[-<variant>].md`), staleness banner from `exports.brain_revision`, and a warning when readiness is under 70.
7. Tests: snapshot tests for both renderers on the tutor fixture; validators (cycle, uncovered must requirement, bad phase ordering, empty criteria, task-count bounds); topological ordering; staleness logic; Playwright with the MockProvider: generate plan → PRD → prompt → copy button works → edit a requirement → banners show "Out of date".

CONSTRAINTS
- Renderers are pure and deterministic: the same Brain gives the same Markdown (inject timestamps).
- Variant text is generic guidance only: no claims about tool behavior beyond file-name suggestions, plus a line telling the user to check each tool's docs.
- Never render model output as HTML.

ACCEPTANCE CHECKLIST
- [ ] Steps 8–10 of §13 pass
- [ ] Each bad-plan fixture is rejected with the right validator code
- [ ] For the fixture, the full text of every `must` requirement appears exactly once in the generated agent prompt (other sections use keys only), and IMPLEMENTATION ORDER is a valid topological order of the tasks (both asserted in tests)
- [ ] Download filenames and contents are correct, and each copy button copies the selected variant
- [ ] `npm run check` and the e2e test pass

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 7 — Hardening, evals, documentation

```text
You are implementing PHASE 7 — Hardening, evals, and documentation.

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §10, §11, §13. Check docs/PROGRESS.md.

GOAL
Make the MVP trustworthy: verified security properties, a repeatable quality eval of the AI, and a README that lets a stranger run it.

TASKS
1. Security review against §10. Write `docs/SECURITY-CHECKLIST.md` listing each item, how it is enforced, and how you verified it. Fix gaps. Add `scripts/check-bundle-secrets.ts`: build the app and fail if the value of any non-`NEXT_PUBLIC_` env var, or a string in a known secret format (for example `sk-ant-`, `sk-proj-`, `sb_secret_`, a JWT whose role is `service_role`), appears in `.next/static`. The Supabase URL and publishable key are public by design and must be allow-listed.
2. Input hardening: body-size limits, `.strict()` on op payloads, maximum lengths, safe error messages (no provider bodies, no stack traces to clients). Add the basic security headers in `next.config`.
3. Rate-limit tests including Retry-After; confirm the limits are configurable through env.
4. Accessibility pass: keyboard paths, focus rings, aria labels, contrast. Fix what you find and record the results.
5. States audit: every page has loading, empty and error states (list the pages you checked).
6. Evals: `evals/ideas/*.json` (5 diverse ideas: tutor marketplace; restaurant ordering SaaS; internal inventory tool; habit-tracking mobile app; AI writing assistant SaaS), `evals/run.ts` and `npm run eval` (opt-in, real provider, prints a cost warning first). The runner performs analyze_idea, two scripted answer rounds (first option each), accepts all proposals, generates the plan, asserts the eval properties in §11, and writes a Markdown report to `evals/results/`.
7. Playwright: run §13 steps 2–10 as the main e2e test with the MockProvider.
8. README: what it is, an architecture diagram (Mermaid, from §3.2), setup (Supabase, env, migrations), scripts, switching providers, running tests and evals, known limitations (including the one in §10), and a pointer to the backlog.
9. Final pass: remove dead code, unused dependencies, and TODOs; make sure CLAUDE.md and docs/PROGRESS.md are current.

CONSTRAINTS
- Do not add features. Fixes and verification only.
- Evals never run inside `npm run check`.

ACCEPTANCE CHECKLIST
- [ ] `docs/SECURITY-CHECKLIST.md` is complete and the bundle-secrets check passes
- [ ] §13 passes end to end (list each step with its evidence)
- [ ] `npm run eval` produces a report for all 5 ideas (paste the summary table and note failures honestly)
- [ ] A fresh clone follows the README and the app runs (state what you ran)
- [ ] `npm run check` passes

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Phase 8 — Landing page (optional)

```text
You are implementing PHASE 8 — Landing page (optional).

READ FIRST: CLAUDE.md, docs/MVP-SPEC.md §8.3, §9.4, §9.6. Check docs/PROGRESS.md.

GOAL
A restrained, technical landing page at `/` that explains the product and leads into the app.

TASKS
1. Sections: nav (wordmark, Sign in, Start Building), hero (copy in §9.6), the animated transformation, "How it works" (3 steps), a sample output (the section skeleton of the AI coding prompt from §8.3: headings with short placeholder descriptions and no invented project data, in a code block), the closing statement, footer.
2. Animated transformation: a client component that types the example idea, then reveals the Architect stage and the checklist line by line, ending on "READY FOR AI CODING". It plays once, pauses when off-screen, and under `prefers-reduced-motion` renders the final state statically.
3. Visual rules: tokens only; at most one subtle hairline accent instead of gradients; no illustrations, no sparkle icons; strong typographic hierarchy; content width about 1120px.
4. CTAs: "Start Building" goes to `/projects/new` when signed in, otherwise `/signup`; "See How It Works" smooth-scrolls to the anchor.
5. Metadata: title, description, Open Graph, favicon.
6. Tests: a Playwright smoke test (page loads, CTAs route correctly, reduced motion renders statically) and an axe accessibility check on `/`.

CONSTRAINTS
- Copy only from §9.6 plus the §8.3 section skeleton: no invented claims, metrics, testimonials or logos.
- No new dependency beyond a small animation approach (CSS, or one lightweight library you justify).

ACCEPTANCE CHECKLIST
- [ ] Lighthouse (local, mobile emulation) is at least 90 for performance and 95 for accessibility (paste the scores)
- [ ] No horizontal scroll at 375px
- [ ] The reduced-motion variant is verified
- [ ] `npm run check` and the e2e test pass

WHEN DONE
Update docs/PROGRESS.md. Reply with: what you built, how you verified each checklist item, assumptions you made, and anything you need from me.
```

---

## Utility prompts

**REVIEW** — run in a new session after each phase. Replace N.

```text
Review PHASE N of Blueprint against its checklist. Do not write code yet.
1. Read CLAUDE.md, the sections of docs/MVP-SPEC.md that the phase references, the phase prompt in docs/PHASES.md, and docs/PROGRESS.md.
2. For every checklist item, verify it independently by running commands and tests or by inspecting the code. Do not trust PROGRESS.md.
3. List spec deviations, missing tests, layering violations, hardcoded values and security issues, each with file and line and a severity.
4. Output a prioritized fix list, then wait for my go-ahead before changing anything.
```

**UNBLOCK** — when an agent stalls or drifts.

```text
Stop. In at most 10 lines: (1) what you are trying to do, (2) what failed, (3) which spec section governs it, (4) your proposed minimal fix. If the spec is silent, choose the simplest option, log it under "Assumptions" in docs/PROGRESS.md, and continue. If it is a security or data-loss decision, ask me first.
```

---

## Backlog (after the MVP)

1. **MCP server for the Brain** — read tools (spec, tasks) and a task-state update tool, so coding agents read the spec live and report progress. This is the natural "execution plane" next step.
2. **Version history** — snapshot per revision, compare, restore (events are already logged).
3. **Dependency graph and impact analysis** — "this decision affects N items", from `affects` and `depends_on` links.
4. **Generated diagrams** — user flows, ERD, architecture; Mermaid first, an editor later.
5. **Streaming responses** — stream `reply` first, apply ops on completion.
6. **Import** — documents, screenshots, URLs, with SSRF protection and prompt-injection handling.
7. **Templates** that pre-seed the interview (marketplace, SaaS, internal tool, and so on).
8. **Model configuration UI** per job, and more providers.
9. **Teams** — multi-user projects, roles, comments.
10. **Indonesian UI** (i18n).
11. **More item types** (API endpoints, user stories) and GitHub issue sync.
12. **Lock down direct writes** — make `commit_brain` the only writer (revoke direct table writes, use `SECURITY DEFINER` with explicit ownership checks), closing the limitation in spec §10.
