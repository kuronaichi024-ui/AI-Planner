/**
 * A failed database operation. Carries the operation name and the Postgres or
 * PostgREST error code only: never row data, user text, or provider messages.
 */
export class DbError extends Error {
  readonly operation: string;
  readonly code: string | undefined;

  constructor(operation: string, code?: string) {
    super(`Database operation failed: ${operation}${code ? ` (${code})` : ''}`);
    this.name = 'DbError';
    this.operation = operation;
    this.code = code;
  }
}
