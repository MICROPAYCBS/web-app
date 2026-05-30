import 'server-only';

import { cookies } from 'next/headers';
import type { ServerSession } from './types';
import { sessionCookieAttributes } from './cookie-options';

const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 8; // 8 hours
const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 14; // 14 days

export async function setSessionCookie(
  session: ServerSession,
  options?: { remember?: boolean }
): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = options?.remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
  const attrs = sessionCookieAttributes(maxAge);
  cookieStore.set(attrs.name, JSON.stringify(session), attrs);
}

/** Expire session cookie using the same attributes as {@link setSessionCookie}. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const attrs = sessionCookieAttributes(0);
  cookieStore.set(attrs.name, '', {
    ...attrs,
    maxAge: 0,
    expires: new Date(0)
  });
}
