import 'server-only';

import { SESSION_COOKIE_NAME } from './constants';

/** Shared attributes for `mifos-session` — must match on set and clear. */
export function sessionCookieAttributes(maxAge: number) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production'
  };
}
