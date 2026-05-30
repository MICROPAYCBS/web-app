import type { SessionUser } from '@mifos/auth';
import { parseServerSessionJson, toPublicSession } from './sanitize';
import type { ServerSession } from './types';

export function getDevServerSession(): ServerSession | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const raw = process.env.RBAC_DEV_SESSION;
  if (!raw) {
    return null;
  }
  return parseServerSessionJson(raw);
}

/** @deprecated Use getDevServerSession — kept for middleware env parity */
export function getDevSessionUser(): SessionUser | null {
  return toPublicSession(getDevServerSession());
}

export function isRbacEnabled(): boolean {
  return process.env.RBAC_ENABLED !== 'false';
}
