import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv, envSchema } from '@/config/env';

const base = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
};

describe('env parsing', () => {
  it('accepts the bare minimum (mock provider)', () => {
    const env = parseEnv({ ...base });
    expect(env.AI_PROVIDER).toBe('mock');
    expect(env.RATE_LIMIT_TURNS_PER_HOUR).toBe(20);
    expect(env.RATE_LIMIT_GENERATIONS_PER_HOUR).toBe(5);
  });

  it('applies default rate limits when omitted', () => {
    const env = parseEnv({ ...base });
    expect(env.RATE_LIMIT_TURNS_PER_HOUR).toBe(20);
    expect(env.RATE_LIMIT_GENERATIONS_PER_HOUR).toBe(5);
  });

  it('fails fast when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: '' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/
    );
  });

  it('fails fast when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
    );
  });

  it('fails fast when SUPABASE_URL is not a URL', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/
    );
  });

  it('requires ANTHROPIC_API_KEY and AI_MODEL_INTERVIEW when AI_PROVIDER=anthropic', () => {
    expect(() => parseEnv({ ...base, AI_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() =>
      parseEnv({
        ...base,
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'sk-test',
      })
    ).toThrow(/AI_MODEL_INTERVIEW/);
  });

  it('requires OPENAI_API_KEY and AI_MODEL_INTERVIEW when AI_PROVIDER=openai', () => {
    expect(() => parseEnv({ ...base, AI_PROVIDER: 'openai' })).toThrow(/OPENAI_API_KEY/);
    expect(() =>
      parseEnv({
        ...base,
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-test',
      })
    ).toThrow(/AI_MODEL_INTERVIEW/);
  });

  it('accepts anthropic provider with both key and model', () => {
    const env = parseEnv({
      ...base,
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-test',
      AI_MODEL_INTERVIEW: 'claude-test',
    });
    expect(env.AI_PROVIDER).toBe('anthropic');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-test');
    expect(env.AI_MODEL_INTERVIEW).toBe('claude-test');
  });

  it('coerces numeric rate limits from strings', () => {
    const env = parseEnv({
      ...base,
      RATE_LIMIT_TURNS_PER_HOUR: '10',
      RATE_LIMIT_GENERATIONS_PER_HOUR: '3',
    });
    expect(env.RATE_LIMIT_TURNS_PER_HOUR).toBe(10);
    expect(env.RATE_LIMIT_GENERATIONS_PER_HOUR).toBe(3);
  });

  it('rejects negative rate limits', () => {
    expect(() => parseEnv({ ...base, RATE_LIMIT_TURNS_PER_HOUR: '-1' })).toThrow(
      /RATE_LIMIT_TURNS_PER_HOUR/
    );
  });
});

describe('envSchema shape', () => {
  it('exports the schema', () => {
    expect(envSchema).toBeDefined();
    expect(typeof envSchema.safeParse).toBe('function');
  });
});

describe('getEnv() startup validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects naming NEXT_PUBLIC_SUPABASE_URL when env is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

    const { register } = await import('@/instrumentation');
    await expect(register()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('resolves when the environment is valid', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('AI_PROVIDER', 'mock');

    const { register } = await import('@/instrumentation');
    await expect(register()).resolves.toBeUndefined();
  });

  it('does nothing when NEXT_RUNTIME is not nodejs', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    const { register } = await import('@/instrumentation');
    await expect(register()).resolves.toBeUndefined();
  });

  it('still has the getEnv() call in instrumentation.ts', async () => {
    const source = readFileSync(resolve(process.cwd(), 'src/instrumentation.ts'), 'utf8');
    expect(source).toMatch(/getEnv\(\)/);
  });
});
