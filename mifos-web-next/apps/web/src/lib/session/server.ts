import { cookies } from 'next/headers';
import type { SessionUser } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from './constants';
import { getDevServerSession } from './dev-user';
import { parseServerSessionJson, toPublicSession } from './sanitize';
import type { ServerSession } from './types';

/** Full session including Fineract auth — server-only. */
export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const fromCookie = parseServerSessionJson(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (fromCookie) {
    return fromCookie;
  }
  return getDevServerSession();
}

/** Safe subset for Client Components (`SessionProvider`, `<Can>`). */
export async function getPublicSession(): Promise<SessionUser | null> {
  return toPublicSession(await getServerSession());
}
