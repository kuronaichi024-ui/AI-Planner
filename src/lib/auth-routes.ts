export const LOGIN_PATH = '/login';
export const SIGNUP_PATH = '/signup';
export const PROJECTS_PATH = '/projects';

/** /projects and everything below it requires a signed-in user. */
export function isProtectedPath(pathname: string): boolean {
  return pathname === PROJECTS_PATH || pathname.startsWith(`${PROJECTS_PATH}/`);
}

export function isAuthPagePath(pathname: string): boolean {
  return (
    pathname === LOGIN_PATH ||
    pathname === SIGNUP_PATH ||
    pathname.startsWith(`${LOGIN_PATH}/`) ||
    pathname.startsWith(`${SIGNUP_PATH}/`)
  );
}

/**
 * Where a request should be redirected, or null to let it through.
 * Signed-out users on protected paths go to /login; signed-in users on
 * /login or /signup go to /projects.
 */
export function resolveAuthRedirect(pathname: string, signedIn: boolean): string | null {
  if (!signedIn && isProtectedPath(pathname)) return LOGIN_PATH;
  if (signedIn && isAuthPagePath(pathname)) return PROJECTS_PATH;
  return null;
}
