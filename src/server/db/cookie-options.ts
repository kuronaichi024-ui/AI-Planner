/**
 * Options for the Supabase auth cookies, shared by the server client and the
 * proxy session helper (they must match).
 *
 * httpOnly: this app has no browser-side Supabase client (spec section 3.2), so
 * scripts never need to read the session. Marking the cookies httpOnly keeps
 * the tokens out of reach of any injected script. If a browser client is ever
 * added, remove httpOnly here and in the library defaults it falls back to.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;
