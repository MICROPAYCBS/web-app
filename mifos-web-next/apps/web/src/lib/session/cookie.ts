import 'server-only';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import type { ServerSession } from './types';

const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 8; // 8 hours
const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 14; // 14 days

export async function setSessionCookie(
  session: ServerSession,
  options?: { remember?: boolean }
): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = options?.remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production'
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
