# Progress Log — Blueprint

## Done

### Phase 0 — Foundation (Complete)

**Scaffolding & Tooling**
- Next.js 16 (App Router, TypeScript strict, `src/` directory, `@/*` alias)
- Tailwind CSS v3.4.17 (PostCSS), shadcn/ui (zinc baseColor, cssVariables) with all required components
- Prettier, ESLint 9 + typescript-eslint, Vitest (jsdom + Testing Library), Playwright config (3 projects)
- npm scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`, `format`, `check`

**Design Tokens & Theme**
- CSS variables for light/dark per MVP-SPEC §9.4 (zinc neutrals, single blue accent #2563EB, success/warning/danger states)
- Tailwind theme mapping (colors, font families: Inter + JetBrains Mono, radius, spacing)
- `next-themes` with `ThemeToggle`, compact 14px base density
- `/styleguide` page (404 in prod) demonstrating all tokens, typography, buttons, provenance chips (USER/AI-INFERRED/AI-RECOMMENDED/PROPOSED/OPEN), badges, form elements, item-list row, skeleton, empty state — works in both themes

**Configuration**
- `src/config/app.ts`: `APP_NAME = "Blueprint"`
- `src/config/env.ts`: Zod-validated env schema with provider-conditional requirements (fail-fast with clear error naming missing variable)
- `.env.example` with every variable from MVP-SPEC §12

**Server Module Skeletons (pure boundaries documented)**
- `src/server/db/index.ts` — only module in `src/` that may import `@supabase/*`
- `src/server/brain/index.ts` — pure TypeScript: no React, Supabase, server/ai, Date/crypto
- `src/server/ai/index.ts` — AI orchestration, returns validated ops, never writes DB directly
- `src/server/outputs/index.ts` — pure renderers/validators, no React, Supabase, server/ai

**Guardrails (ESLint no-restricted-imports)**
- `server/brain` cannot import React, Supabase, `server/ai`, `server/db`, or `server-only`
- `server/outputs` cannot import React, Supabase, `server/ai`, `server/db`, or `server-only`
- Within `src/`, only `server/db` may import `@supabase/*`
- Client components (`src/components/**`) may only import `server/brain`, `src/lib`, `src/config/app.ts`
- Proven by temporary test files that lint errors on forbidden imports

**Pages & Layout**
- Root layout with Inter/JetBrains Mono via `next/font`, `ThemeProvider`, `ThemeToggle`
- `/` shows APP_NAME + dev-mode link to `/styleguide`
- 404 and error pages using design system components

**Tests**
- Vitest: 12 passing tests (sample + env parsing with provider-conditional validation)
- Playwright: config with chromium, mobile-chrome (Pixel 5), mobile-safari (iPhone 12)

## Decisions

- TypeScript pinned to `~5.9.0` (v7 breaks `@typescript-eslint/parser` peer)
- Tailwind downgraded to v3.4.17 (v4 CLI/PostCSS incompatible with Next.js + shadcn/ui workflow)
- ESLint pinned to `^9.0.0` (satisfies `eslint-config-next` peer)
- shadcn/ui with zinc baseColor and CSS variables for consistent token consumption
- ESM (`"type": "module"`) to match Next.js 16 Turbopack defaults; config files renamed to `.cjs`
- `server-only` mocked in Vitest via alias to avoid import-time errors in test environment
- Env validation uses Zod `superRefine` for provider-conditional key requirements (fail-fast per §12)

## Assumptions

- All text/background token pairs asserted ≥4.5:1 by an automated test (`tests/contrast.test.ts`) parsing `src/app/globals.css` and checking all component-used pairs in both light and dark modes. Token adjustments: light `--success` → 142.1 76.2% 29%, light `--warning` → 32.1 94.6% 34%, dark `--success-foreground` → near-black text on bright green fill, light `--muted-foreground` → zinc-700 (zinc-500 measured 4.39:1 on zinc-100, below threshold), light `--chip-ai-recommended` → 175.3 77.4% 26.1% (darker teal for AA on white), dark `--chip-ai-recommended` → 175.3 77.4% 50% (brighter teal for AA on near-black). `provenance-chip.tsx` uses `--chip-*` tokens directly instead of `text-primary` or raw teal classes.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` uses the new publishable key format (`sb_publishable_…`) per spec guidance; legacy anon key accepted as fallback.
- `AI_PROVIDER=mock` is the default; provider keys and models only required when provider is not `mock`.
- Test credentials (`TEST_USER_A_*`, `TEST_USER_B_*`) are optional and only used by `scripts/verify-rls.ts` in Phase 1.
- Playwright e2e tests not yet implemented (Phase 0 only requires config).

## Open questions

- None for Phase 0.
