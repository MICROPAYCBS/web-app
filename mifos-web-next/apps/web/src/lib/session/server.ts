import { cookies } from 'next/headers';
import type { SessionUser } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from './constants';
import { parseServerSessionJson, toPublicSession } from './sanitize';
import type { ServerSession } from './types';

/**
 * Full session including Fineract auth — server-only.
 * Only reads the `mifos-session` cookie (set by login or explicit demo action).
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  return parseServerSessionJson(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

/** Safe subset for Client Components (`SessionProvider`, `<Can>`). */
export async function getPublicSession(): Promise<SessionUser | null> {
  return toPublicSession(await getServerSession());
}
