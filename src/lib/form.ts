/**
 * Shared shape for Server Action results used with React's useActionState.
 * Client-safe: no server imports.
 */
export type ActionStatus = 'idle' | 'error' | 'success';

export type ActionState = {
  status: ActionStatus;
  /** A message for the whole form (shown in an alert or status region). */
  message?: string;
  /** One message per field name. */
  fieldErrors?: Record<string, string>;
  /** Submitted values to repopulate the form after an error. Never contains passwords. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { status: 'idle' };

/** Reads a string field from FormData; returns '' for missing fields and file uploads. */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

type IssueLike = { path: readonly PropertyKey[]; message: string };

/** Keeps the first issue message for each top-level field. Form-level issues use the key "_form". */
export function firstIssuePerField(error: { issues: readonly IssueLike[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
