import "server-only";
import { z } from "zod";

export const envSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    AI_PROVIDER: z.enum(["mock", "anthropic", "openai"]).default("mock"),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    AI_MODEL_INTERVIEW: z.string().optional(),
    AI_MODEL_GENERATE: z.string().optional(),
    RATE_LIMIT_TURNS_PER_HOUR: z.coerce.number().int().positive().default(20),
    RATE_LIMIT_GENERATIONS_PER_HOUR: z.coerce.number().int().positive().default(5),
    TEST_USER_A_EMAIL: z.string().email().optional(),
    TEST_USER_A_PASSWORD: z.string().optional(),
    TEST_USER_B_EMAIL: z.string().email().optional(),
    TEST_USER_B_PASSWORD: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.AI_PROVIDER === "anthropic") {
      if (!data.ANTHROPIC_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ANTHROPIC_API_KEY is required when AI_PROVIDER is 'anthropic'",
          path: ["ANTHROPIC_API_KEY"],
        });
      }
      if (!data.AI_MODEL_INTERVIEW) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "AI_MODEL_INTERVIEW is required when AI_PROVIDER is 'anthropic'",
          path: ["AI_MODEL_INTERVIEW"],
        });
      }
    }
    if (data.AI_PROVIDER === "openai") {
      if (!data.OPENAI_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "OPENAI_API_KEY is required when AI_PROVIDER is 'openai'",
          path: ["OPENAI_API_KEY"],
        });
      }
      if (!data.AI_MODEL_INTERVIEW) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "AI_MODEL_INTERVIEW is required when AI_PROVIDER is 'openai'",
          path: ["AI_MODEL_INTERVIEW"],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  return result.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export default getEnv;
