import { cookies } from 'next/headers';
import { parseSessionJson, type SessionUser } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from './constants';
import { getDevSessionUser } from './dev-user';

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const fromCookie = parseSessionJson(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (fromCookie) {
    return fromCookie;
  }
  return getDevSessionUser();
}
