/**
 * Database access module.
 *
 * This is the ONLY module within `src/` permitted to import `@supabase/*`.
 * It provides database clients, authentication helpers, repository methods,
 * and handles all persistence logic via Supabase RPCs and tables.
 */
/**
 * Database access module.
 *
 * This is the ONLY module within `src/` permitted to import `@supabase/*`.
 * It provides the user-scoped Supabase client, authentication helpers,
 * repository functions, and (from Phase 2) the commit_brain RPC wrapper.
 * The service_role key is never used. There is no browser-side client.
 */
export { updateSession } from './session';
export type { SessionResult } from './session';
export { getSessionUser, signInWithPassword, signUpWithPassword, signOut } from './auth';
export type { AuthResult } from './auth';
export { mapAuthError } from './auth-errors';
export type { AuthFailure, AuthFailureReason } from './auth-errors';
export { listProjects, getProject, createProject, renameProject, deleteProject } from './projects-repo';
export { DbError } from './errors';
export type { Database } from './types';
