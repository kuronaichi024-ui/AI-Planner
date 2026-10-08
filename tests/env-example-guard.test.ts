import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('env-example-guard', () => {
  it('fails when .env.example has non-empty secrets', () => {
    const content = readFileSync('.env.example', 'utf8');
    const lines = content.split('\n').filter((line) => !line.startsWith('#') && line.includes('='));
    
    const secretPatterns = [
      /^TEST_USER_[A-Z_]+=/,
      /[A-Z_]*_KEY=/,
      /[A-Z_]*_PASSWORD=/,
      /[A-Z_]*_URL=/,
    ];
    
    const violations: string[] = [];
    for (const line of lines) {
      const [key, value] = line.split('=');
      const trimmedValue = value?.trim() || '';
      
      if (trimmedValue && secretPatterns.some((pattern) => pattern.test(key))) {
        violations.push(line);
      }
    }
    
    expect(violations).toEqual([]);
  });
});
