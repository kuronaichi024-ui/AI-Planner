import 'server-only';

/**
 * Logs a failed action without leaking anything: only the operation name and an
 * error code. Never pass prompts, user text, emails or provider messages.
 */
export function logActionError(operation: string, error: unknown): void {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : undefined;
  console.error(JSON.stringify({ level: 'error', event: 'action_failed', operation, code }));
}
