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
  {
    files: ["src/server/brain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "@supabase/*", "@/server/ai", "@/server/db", "server-only"],
              message: "server/brain is pure: no React, Supabase, server/ai, or server/db.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/outputs/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "@supabase/*", "@/server/ai", "@/server/db", "server-only"],
              message: "server/outputs is pure: no React, Supabase, server/ai, or server/db.",
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
              group: ["@supabase/*", "@/server/db", "@/server/ai", "@/server/outputs"],
              message:
                "Client components may only import server/brain (types, schemas, pure functions), src/lib, and src/config/app.ts.",
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
