import type { SessionUser } from '@mifos/auth';
import { parseSessionRoles } from '@mifos/auth';
import type { ServerSession } from './types';

const SECRET_KEYS = [
  'accessToken',
  'base64EncodedAuthenticationKey',
  'twoFactorAccessToken',
  'twoFactorValidTo'
] as const;

/** Strip Fineract auth secrets before passing session to client components. */
export function toPublicSession(session: ServerSession | null): SessionUser | null {
  if (!session) {
    return null;
  }
  const copy = { ...session } as Record<string, unknown>;
  for (const key of SECRET_KEYS) {
    delete copy[key];
  }
  return {
    ...(copy as unknown as SessionUser),
    roles: parseSessionRoles(copy.roles)
  };
}

export function parseServerSessionJson(raw: string | null | undefined): ServerSession | null {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as ServerSession;
    if (!data || typeof data.userId !== 'number' || !Array.isArray(data.permissions)) {
      return null;
    }
    return {
      ...data,
      roles: parseSessionRoles(data.roles)
    };
  } catch {
    return null;
  }
}
