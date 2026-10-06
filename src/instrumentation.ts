import { getEnv } from '@/config/env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment variables on server startup. Throws immediately
    // with the offending variable name(s) if configuration is invalid.
    getEnv();
  }
}
