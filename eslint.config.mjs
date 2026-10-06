import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "docs/**",
    ],
  },
  // Generic guardrail: only src/server/db may import @supabase/*.
  // Placed first because flat config does not merge rule options; later blocks
  // that also use no-restricted-imports repeat this restriction for themselves.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*", "supabase/*"],
              message: "Only src/server/db may import Supabase client libraries.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/brain/**/*.ts", "src/server/outputs/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "@supabase/*",
                "supabase/*",
                "server-only",
                "**/server/ai",
                "**/server/ai/**",
                "**/server/db",
                "**/server/db/**",
                "**/ai",
                "**/ai/**",
                "**/db",
                "**/db/**",
              ],
              message: "server/brain and server/outputs are pure: no React, Supabase, server/ai, server/db, server-only, or relative globs that reach those layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.ts", "src/components/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "supabase/*",
                "**/server/db",
                "**/server/db/**",
                "**/server/ai",
                "**/server/ai/**",
                "**/server/outputs",
                "**/server/outputs/**",
                "**/config/env",
                "**/config/env/**",
              ],
              message:
                "Client components may only import server/brain (types, schemas, pure functions), src/lib, and src/config/app.ts. src/config/env reads secrets and stays server-side; Supabase and other server layers are forbidden.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default config;