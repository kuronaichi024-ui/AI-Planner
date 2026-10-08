# Phase 2 brief: Project Brain domain

For the coding agent. Scope: a pure TypeScript domain layer (`src/server/brain`) plus its database wrapper (`src/server/db`). No UI, no AI, no new routes, no new migration.
Contract: `docs/PHASES.md` section "Phase 2" (tasks 1 to 10 and the acceptance checklist) and `docs/MVP-SPEC.md` sections 4, 6.5, 7 and 11, plus 5.1 for the RPC. Read those spec sections once (about 250 lines). This brief settles the places where the spec is silent or ambiguous (section 4, numbered D1 to D27), gives golden values to test against (section 5), and fixes the order of work (section 6). If the brief and the spec disagree, the spec wins; log the conflict under "Open questions" in `docs/PROGRESS.md`.

## 1. Working rules

1. Read only the Phase 2 section of `docs/PHASES.md` and the spec sections named above. Do not re-read them later.
2. Do not print files back. Write, run one check, read the last 30 lines of its output.
3. Write up to 6 files per round, then `npm run typecheck`. At the end of each step run its checkpoint and commit only the files you touched: `git add <files>`, `git commit -m "phase2: <what>"`. Never `git add -A`. Never push.
4. Keep this checklist in `docs/PROGRESS.md` under `## Phase 2 status` and tick it at every checkpoint, so a new session or another model resumes at the first unticked line:
   ```
   - [ ] 0 orient
   - [ ] 1 schemas and keys
   - [ ] 2 applyOps
   - [ ] 3 classify and select
   - [ ] 4 readiness and counts
   - [ ] 5 digest
   - [ ] 6 database wrapper
   - [ ] 7 fixture, seed script, integration test
   - [ ] 8 invariant tests, guards, coverage
   - [ ] 9 final checks, docs, report
   ```
5. Never guess an API. If it is not in section 3, read the installed package's own docs or types.
6. If the same command fails twice for the same reason, stop retrying: log the blocker under "Open questions" and continue with a step that does not depend on it.
7. Before editing an existing file, read all of it (the edit tool refuses blind overwrites). After every batch run `git status --short` and confirm the files you meant to change did change. If a write was refused, redo it. Never move on assuming it landed.
8. Secrets: never write real values (URLs, keys, emails, passwords) into any tracked file. `.env.example` stays blank; real values live only in `.env.local`. Read `git diff --cached` before every commit. If `tests/env-example-guard.test.ts` does not exist, add it: it fails when `.env.example` has a non-empty value for any `TEST_USER_*`, `*_KEY`, `*_PASSWORD` or `*_URL` entry.
9. Report only what exists. Before the final report run `git status --short` and `git log --stat -8`. Every claim must match a file or a command output you saw. (Phase 1's chat summary claimed "debounced rename" and "toast routing"; neither was in the code.)
10. Do not touch Phase 1 files except to add exports, scripts or config keys. If you believe the database must change, stop and log it; do not write a migration.
11. `src/server/brain` imports nothing from react, supabase, server-only, server/ai or server/db (lint-enforced), does no I/O, and uses no clock or randomness (inject `now` and ids). A guard test enforces the last part (step 8).
12. Text style: English, no emojis, no em dashes.

## 2. Step 0: orient (at most 5 tool calls)

`git status --short`, `git log --oneline | head -5`, read `docs/PROGRESS.md`, add the checklist above, and resume from the first unticked step. The seed script and the integration test need working `TEST_USER_A_*` credentials in `.env.local`. If sign-in fails with invalid credentials, say so once in the final report and keep working on everything else.

## 3. Verified facts for the installed versions (do not re-research)

Versions: zod 4.6, vitest 5.0.3, typescript 5.9.3, `@supabase/supabase-js` 2.117.

- Zod 4: use `z.strictObject({...})`, `z.iso.datetime()` (accepts `2026-10-08T07:00:00.000Z`, rejects date-only), and `z.partialRecord(z.enum(PREFIXES), z.number())` for `counters`. A plain `z.record(z.enum([...]), ...)` is exhaustive in Zod 4: it rejects `{ REQ: 1 }` because the other keys are missing (checked). This pattern compiles and narrows `item.data` by `item.type` (checked against this repo):

```ts
const base = {
  key: z.string().regex(/^[A-Z]+-\d{3,}$/),
  title: z.string().trim().min(1).max(120),
  source: z.enum(['user', 'ai_inferred', 'ai_recommended']),
  status: z.enum(['confirmed', 'rejected']),
  reason: z.string(),
  evidence: z.string().optional(),
  confidence: z.number().min(0).max(1),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
};
function itemOf<T extends string, D extends z.ZodType>(type: T, data: D) {
  return z.strictObject({ ...base, type: z.literal(type), data });
}
export const ItemSchema = z
  .discriminatedUnion('type', [itemOf('requirement', RequirementData), itemOf('goal', GoalData) /* ...all 11 */])
  .superRefine((item, ctx) => {
    if (item.source === 'user' && !item.evidence) {
      ctx.addIssue({ code: 'custom', path: ['evidence'], message: 'Evidence is required for user items.' });
    }
  });
export type Item = z.infer<typeof ItemSchema>;
// Op: z.discriminatedUnion('op', [create, update, delete, link, unlink]) with z.strictObject members.
```

- Coverage: install exactly `npm i -D @vitest/coverage-v8@5.0.3` (its peer dependency is exactly the installed vitest, 5.0.3). These options work from the CLI and map to the same keys under `test.coverage` in `vitest.config.ts`: `provider: 'v8'`, `include: ['src/server/brain/**']`, `reporter: ['text']`, `thresholds: { lines: 85 }`. Add a script `"test:coverage": "vitest run --coverage"` and keep `check` free of coverage.
- `server-only` throws when imported in plain Node, so a script (tsx) cannot import any module that imports it. That is why the RPC wrapper is split in two files (D23).
- The `commit_brain` function raises plain exceptions whose message is the token: `PROJECT_NOT_FOUND`, `REVISION_CONFLICT`, `INVALID_PROPOSAL_STATUS`, `PROPOSAL_NOT_PENDING` (checked on Postgres). Through PostgREST they should arrive as `error.message`; confirm with the integration test. The generated types describe the arguments: read `Database['public']['Functions']['commit_brain']['Args']` in `src/server/db/types.ts` for exact names (`p_project_id`, `p_expected_revision`, ...).
- Scripts run with `node --env-file=.env.local --import tsx scripts/<name>.ts` (Phase 1 already uses this for `verify:rls`). If tsx cannot resolve the `@/` alias inside a shared file, use relative imports in that file.
- Vitest uses jsdom by default; put `// @vitest-environment node` as the first line of tests that need Node. `mergeConfig` concatenates arrays, so a config built by merging the default one keeps its `exclude`; write the integration config standalone (step 7).
- Lint: `src/server/brain/**` also forbids import paths ending in `/db` or `/ai`, so never name a brain folder or file that way.

## 4. Decisions already made (do not revisit; list the ones you rely on under Assumptions)

Model and schemas

- D1. Item types (snake_case, as in the link table) and prefixes: vision VIS, goal GOAL, role ROLE, requirement REQ, feature FEAT, screen SCR, entity ENT, business_rule BR, decision DEC, assumption ASM, task TASK. Key = prefix + `-` + number padded to 3 digits (grows past 999). The prefix must match the type.
- D2. Title uniqueness is per type, case-insensitive, over ALL items including tombstones. Compare on `trim`, collapse whitespace, `normalize('NFKC')`, lowercase. The stored title is trimmed only.
- D3. `source: 'user'` is always stored with `confidence` 1 (a create op with another value is normalized, not rejected). Other sources keep their value, which must be in 0..1. A create with `source: 'user'` and missing or blank `evidence` fails with `EVIDENCE_REQUIRED`, checked before the schema; every other invalid create is `SCHEMA_INVALID`.
- D4. `MANUAL_EVIDENCE = '[manual]'` is exported. UI-originated ops carry it.
- D5. `BrainSchema` also checks integrity with `superRefine`: unique keys; key prefix matches type; each counter is at least the highest number used for its prefix; link endpoints exist and are confirmed items; no duplicate (from, kind, to); every link allowed by the matrix; no `depends_on` cycle; at most one confirmed vision; unique normalized titles per type. Export `parseBrain(value)` returning a Zod `safeParse` result, and `EMPTY_BRAIN` equal to the database default. A test must compare it with the JSON literal in `supabase/migrations/0001_init.sql` (drift guard).

applyOps (signature `applyOps(brain, ops, ctx) => { brain, results, refs }`; `refs` maps temp refs to the keys they received)

- D6. Never mutate inputs. Process ops in order. Each op succeeds or fails alone. `results[i]` belongs to `ops[i]`. A link whose endpoint is a temp ref declared by a LATER create in the same batch is deferred to the end of the batch; if it still cannot resolve it fails with `UNKNOWN_REF`. A ref of a failed create never resolves.
- D7. Temp refs match `/^@\d+$/` and are unique per batch; a duplicate is `SCHEMA_INVALID`.
- D8. Only confirmed items are addressable. `update`, `delete`, `link`, `unlink` and link endpoints that name a tombstone or an unknown key fail with `UNKNOWN_REF`.
- D9. A self-link is `LINK_NOT_ALLOWED`. `unlink` of a link that does not exist is `UNKNOWN_REF`. A `depends_on` edge that would close a cycle (following `depends_on` edges only) is `CYCLE`.
- D10. `update` replaces `item.reason` with the op's `reason`, sets `evidence` when given, sets `updated_at = ctx.now`. If `op.evidence === MANUAL_EVIDENCE` and `ctx.actor === 'user'` it also sets `source = 'user'`, `confidence = 1`. Any other update (for example the user accepting an AI proposal) leaves `source` and `confidence` alone. `data` is deep-merged (plain objects merge, arrays are replaced, `undefined` is ignored) and the merged data is re-validated (`SCHEMA_INVALID`). A changed title is re-checked for uniqueness excluding the item itself.
- D11. `delete` removes the item and every link that touches it. Counters never move backwards.
- D12. Revival: a `create` with `source: 'user'` whose type and normalized title match a tombstone turns that tombstone into a confirmed item (same key, same `created_at`, new data, reason, evidence, confidence, `updated_at`). Any other create that matches a tombstone is `DUPLICATE_TITLE`.
- D13. `VISION_SINGLETON` counts confirmed visions only; reviving a vision tombstone (D12) is subject to the same check.
- D14. A create result may carry `droppedLinks: { kind, to, code, message }[]` for embedded `links` entries that failed; the item itself still exists.
- D15. `previewApply(brain, ops)` uses `{ actor: 'user', userApproved: true, now: PREVIEW_NOW }` with `PREVIEW_NOW = '1970-01-01T00:00:00.000Z'` (timestamps do not affect readiness).

classify, select, tombstones

- D16. `verifyEvidence(evidence, corpus)`: normalize both with `NFKC`, curly quotes to straight quotes, lowercase, collapse whitespace; trim leading and trailing punctuation and whitespace from the evidence; then substring match. Empty evidence fails. `[manual]` never verifies. `classifyOps` returns `{ auto, review, downgraded }`: `downgraded` is the list of rewritten ops, which are also in `review`. A downgrade sets `source: 'ai_inferred'`, prefixes `reason` with `Evidence not verified: ` and removes the unverified `evidence`. A create with `source: 'user'` and verified evidence is auto. Every update, delete and unlink is review. A link op, or a create's embedded `links` entry, is auto only if both endpoints are existing confirmed items or temp refs of auto creates; otherwise it goes to review. When an auto create has some non-qualifying embedded links, keep the qualifying ones inside the create and emit the others as standalone `link` ops in `review`; give a create without a `ref` a synthetic unused ref (`@` plus the next free number) so those link ops can name it. Rewriting temp refs of auto-created items into real keys before the review ops are stored is Phase 3 work: do not build it, but return `refs` from `applyOps` for it.
- D17. `StoredOp = Op & { opId: string }`. `selectOps(ops, selectedOpIds)` returns `{ selected, rejectedCreates }`. Deselected ops leave `selected`; deselected creates also go to `rejectedCreates`. A `link` or `unlink` op that names a deselected create's ref is dropped. A kept create loses only the embedded `links` entries that name a deselected ref.
- D18. `makeTombstones(brain, rejectedCreates, ctx)` returns the new Brain. It allocates a key for each tombstone, stores `status: 'rejected'` with the op's fields, ignores embedded links, skips an op whose data fails its schema, and skips an op whose type and normalized title already exist (any status). Tombstones skip the vision singleton check.

readiness, counts, digest

- D19. Category ids: `product_definition`, `roles`, `features`, `screens`, `data_model`, `business_rules`, `edge_cases`, `technical_decisions`. Weights as percent integers: 15, 10, 20, 10, 15, 10, 10, 10. An open insight with an unknown category gets no penalty but still counts toward `openBlocking`. `openBlocking` counts open insights with `blocking === true` of any kind, and the 84 cap applies when it is above 0. Penalties apply only to kinds `ambiguity`, `contradiction`, `missing`. The input type is `OpenInsight = { id: string; kind: 'question' | 'ambiguity' | 'contradiction' | 'missing' | 'risk'; title: string; category: string; blocking: boolean }` with a matching `OpenInsightSchema`, both defined in `src/server/brain` (the brain layer cannot import database types). Callers pass open insights only; `computeReadiness` and `buildDigest` do not filter by status.
- D20. The zero-X rule is literal: "every X" checks fail when there are zero X, including D4 (zero `ref` fields fails). The demo fixture therefore needs at least one `ref` field to pass D4. Log this under Open questions as a possible spec quirk. `score` is a number in 0..1 (not rounded), `penalty` is `0.10 * blocking + 0.03 * nonblocking` (not clamped), `overall` is `Math.round(sum of (weightPercent * score))`, and the label is derived from the capped `overall`. Every failing check has a non-empty `id`, `label` and `hint`; the hint should name up to 3 offending item keys where that applies.
- D21. `buildDigest(brain, opts)` returns `{ text, level, estimatedTokens, overBudget }`. `opts = { projectName, ideaText, language, openInsights, failingChecks, tokenBudget = 6000 }`. `estimateTokens(text) = Math.ceil(text.length / 4)`. Choose the first of L0, L1, L2 that fits; L2 is returned even if it does not fit (`overBudget: true`). Layout, in this order: `PROJECT: <name> (<language>)`; `IDEA: <text>` (cut to 400 characters at L1 and L2); `COUNTS: ...`; items grouped by type as `[KEY] title - summary (source, priority)` at L0 (priority only for types that have one: requirement, feature, task), `[KEY] title` at L1, and at L2 only requirement and feature items whose `data.priority` is `must` (every other item is omitted at L2; COUNTS still shows them); `LINKS` grouped by kind as `KEY->KEY` (L0 and L1 only); `REJECTED` tombstones as `[KEY] title`; `OPEN INSIGHTS` as `id kind - title`; `FAILING CHECKS` as `id - label`. Tombstones, insights and failing checks are kept at every level. Use a hyphen, not the spec's em dash. One-line summaries, each cut to 140 characters with `...`: vision statement; goal description; role description plus `perms N`; requirement `[kind] statement`; feature description; screen `route - purpose`; entity `fields: first 6 names (+N)`; business_rule statement; decision `topic: choice`; assumption statement; task `phase N - description (state)`.
- D22. `computeCounts(brain)` counts confirmed items into the `ProjectCounts` keys from `src/lib/project.ts` (reuse the type): requirement to requirements, feature to features, role to roles, screen to screens, entity to entities, business_rule to rules, decision to decisions, task to tasks. Vision, goal and assumption are not counted.

Database, fixture, seed

- D23. Two files. `src/server/db/commit-brain-rpc.ts` has NO `server-only` import and takes the client as a parameter (a small typed structural interface with `rpc`, no `any`): `commitBrainWith(client, params) => Promise<number>` maps camelCase params to the `p_*` arguments and maps error messages to typed errors (`RevisionConflictError`, `ProjectNotFoundError`, `ProposalNotPendingError`, `InvalidProposalStatusError`, otherwise `DbError`). `src/server/db/brain-repo.ts` imports `server-only`, wires the cookie client, and exports `loadProject`, `commitBrain`, `listOpenInsights` (selects `id, kind, title, category, blocking` of the project's rows with `status = 'open'`, parses each row with `OpenInsightSchema`, throws `DbError` on a row that fails), `appendMessage`. Scripts and integration tests import the first file; the app imports the second.
- D24. `loadProject` parses `projects.brain` with `BrainSchema`. An invalid stored Brain throws a typed `BrainInvalidError`; never repair it silently. It returns null when the project is not visible.
- D25. The fixture `tests/fixtures/tutor-brain.ts` starts with a DEMO banner comment, exports `DEMO_LABEL = 'DEMO'`, builds items through a small local helper (defaults for timestamps, source, confidence) to avoid repetition, passes `BrainSchema`, and has an asserted readiness value with the computation written in a comment. Leave 2 or 3 checks deliberately failing and name them in that comment, so the demo has something to resolve later.
- D26. `scripts/seed-demo.ts` is idempotent: sign in as `TEST_USER_A` with plain supabase-js, delete the user's projects named "Tutor Marketplace (DEMO)", insert a new project (name, `idea_text`), compute `computeReadiness(brain, [])` and `computeCounts(brain)`, call `commitBrainWith` once with event `{ actor: 'system', kind: 'seed_demo', summary: 'Demo seed' }`, read the project back and assert `brain_revision === 1`, `readiness_score` and `counts`. Add `"seed:demo": "node --env-file=.env.local --import tsx scripts/seed-demo.ts"`. Print no secrets.
- D27. `applyUserOps` and everything AI-related are Phase 3 and later. Do not build them.

## 5. Readiness golden values

Check totals per category: product_definition 5, roles 3, features 6, screens 4, data_model 4, business_rules 3, edge_cases 2, technical_decisions 5 (32 checks). Test these with hand-built Brains (small helper builders), not only the fixture.

- Empty Brain, no insights: every category 0, `overall` 0, label Early, `openBlocking` 0.
- Everything passes, no insights: 100, Build-ready.
- Everything passes plus one open blocking `contradiction` in `features`: features score 0.9, weighted sum 98, capped to 84, label Almost ready, `openBlocking` 1.
- Everything passes plus one open blocking `question` in `features`: no penalty (score stays 1), sum 100, capped to 84.
- Everything passes plus one open non-blocking `ambiguity` in `roles` and one open `risk` in `features`: roles 0.97, risk ignored, sum 99.7, `overall` 100, Build-ready.
- Only P1 to P5 pass: 15, Early. P1 to P5 plus R1 and R2 pass: 15 + 10 * 2/3 = 21.67, `overall` 22.
- Label boundaries on the capped overall: 39 Early, 40 Taking shape, 69 Taking shape, 70 Almost ready, 84 Almost ready, 85 Build-ready.
- A penalty larger than the pass ratio clamps the category score at 0, never negative.
- Tombstoned (rejected) items never count toward any check.

## 6. Steps

Barrel: `src/server/brain/index.ts` re-exports the public API (types, `ItemSchema`, `OpSchema`, `OpenInsightSchema`, `BrainSchema`, `parseBrain`, `EMPTY_BRAIN`, `ITEM_TYPES`, `PREFIX_BY_TYPE`, `LINK_RULES`, `isLinkAllowed`, `MANUAL_EVIDENCE`, `allocateKey`, `applyOps`, `classifyOps`, `verifyEvidence`, `selectOps`, `makeTombstones`, `previewApply`, `computeReadiness`, `computeCounts`, `buildDigest`, `estimateTokens`) and imports nothing server-only, so client components may use it. Tests go in `tests/brain/`, `tests/db/`, `tests/integration/`, `tests/fixtures/`.

1. Schemas and keys. `schemas.ts` (item data schemas from spec section 4.2 as strict objects, `ItemSchema`, `LinkSchema`, `BrainSchema`, `OpSchema`, `OpenInsightSchema`, enums, `LINK_RULES` as a typed constant), `keys.ts` (`allocateKey(counters, prefix) => { key, counters }`, pure). Tests: every data schema accepts a valid sample and rejects unknown keys and bad enums; key padding and growth past 999; counters never reused; the link matrix, row by row. Checkpoint `npm run check`.
2. `apply.ts` in sub-steps with tests each time: create and update/delete first, then links, temp refs and deferral, then cycles, singleton, tombstone revival, protected items. Scenarios to cover: create goal with evidence gives `GOAL-001` and counter 1; requirement links to a feature through `@1`; a link written before the create it references still resolves; a link to a failed create's ref gives `UNKNOWN_REF`; duplicate title in another case gives `DUPLICATE_TITLE`; second vision gives `VISION_SINGLETON`; user create revives a tombstone and keeps its key while an AI create gives `DUPLICATE_TITLE`; delete removes the item's links and leaves the counter; `depends_on` A to B, B to C, then C to A gives `CYCLE` (feature and task); AI update without `userApproved` gives `PROTECTED_ITEM` and with it succeeds; deep merge keeps untouched fields and replaces arrays; invalid merged data gives `SCHEMA_INVALID`; `[manual]` update upgrades source and confidence; accepting an AI update does not; a failed op does not stop the others; inputs deep-frozen do not throw; same inputs give identical output. Checkpoint `npm run check`.
3. `classify.ts` and `select.ts`. Tests: verified and unverified evidence, punctuation and quote and case differences, `[manual]` and empty evidence, downgrade fields, links following their endpoints, the split of an auto create's embedded links, updates and deletes always review, `selectOps` with deselected refs, tombstones (key allocated, duplicates skipped, links ignored), `previewApply` does not change the input. Checkpoint `npm run check`.
4. `readiness.ts` and `counts.ts`. One focused test per check id (P1 to T-hosting), each passing and failing, zero-X cases, the goldens in section 5, label boundaries, `computeCounts`. Checkpoint `npm run check`.
5. `digest.ts`. Tests: each level is chosen when the budget demands it, `estimatedTokens` is within the budget except for `overBudget`, every item key is present at L0 and L1, every `must` key is present at L2, tombstones and failing checks always present, output is deterministic. Checkpoint `npm run check`.
6. Database wrapper (D23, D24). Unit tests with a fake client: argument mapping to `p_*` names, each error token mapped to its typed error, unknown errors become `DbError`, `loadProject` returns null when not visible and throws `BrainInvalidError` for a bad Brain (fake the client for this too). Checkpoint `npm run check`.
7. Fixture, seed, integration. Write the fixture in two or three parts (D25), a test that it passes `BrainSchema` and that `computeReadiness` equals the asserted value. Write the seed script (D26) and run it (`npm run seed:demo`). Integration test `tests/integration/commit-brain.test.ts`: first line `// @vitest-environment node`, load `.env.local` with `process.loadEnvFile('.env.local')` inside try/catch, skip unless the URL ends with `.supabase.co` and `TEST_USER_A_*` exist, sign in with plain supabase-js, insert a project, `commitBrainWith` at expected revision 0 (assert the returned revision, `brain_revision`, `readiness_score` and `counts`), commit again with expected revision 0 and assert `RevisionConflictError`, delete the project in `finally`. Exclude `tests/integration/**` from the default config, and add a standalone `vitest.integration.config.ts` (environment node, include `tests/integration/**/*.test.ts`, the `@` alias, 30 s timeout) with `"test:integration": "vitest run --config vitest.integration.config.ts"`. Run it and the seed yourself with the real `.env.local`. Checkpoint `npm run check` and both commands.
8. Invariants, guards, coverage.
   - Invariant fuzz test in `tests/brain/invariants.test.ts`: a seeded PRNG (mulberry32, no new dependency), 200 random batches (creates, updates, deletes, links, unlinks, mixed valid and invalid) against a growing Brain. After every batch assert: the result passes `BrainSchema`; the input was not mutated (deep-freeze it); counters never decrease; keys are never reused after deletes; every link endpoint exists; no `depends_on` cycle; running twice gives identical JSON. Include the seed in each assertion message so a failure reproduces.
   - Purity guard `tests/brain/purity-guard.test.ts`: read every file under `src/server/brain` and fail on `Date.now`, `new Date()` with empty parentheses, `Math.random`, `randomUUID`, `crypto.`, `process.env`, `fetch(`, `performance.now`, `setTimeout`, `setInterval`.
   - Coverage: `npm run test:coverage` must show at least 85% lines for `src/server/brain`. Paste the table in the report.
9. Final checks and docs: `npm run check`, `npm run test:coverage`, `npm run test:integration`, `npm run build` (needs network for fonts; a font error is environment, not code). Confirm the layering rules still bite: temporarily add `import 'react'` to a file under `src/server/brain` and `import '@/server/db'` to a file under `src/server/brain`; `npm run lint` must fail on both; remove them. Update `docs/PROGRESS.md` (Done, Decisions, Assumptions D-numbers, Open questions incl. the D4 zero-X note), add `seed:demo`, `test:coverage`, `test:integration` to the Commands line in `CLAUDE.md`. Delete `docs/PHASE2-BRIEF.md` only if the owner says so; otherwise keep it. Commit `phase2: docs`.

## 7. Final report (at most 25 lines)

1. Built: one line per step.
2. Acceptance checklist from `docs/PHASES.md` Phase 2: each item with the exact command or test name and PASS, or NOT RUN and why. Include the real test count and the coverage lines percentage from the command output.
3. Assumptions and decisions logged (point to PROGRESS.md), including every place you deviated from this brief.
4. Anything the owner must do, as exact commands.
