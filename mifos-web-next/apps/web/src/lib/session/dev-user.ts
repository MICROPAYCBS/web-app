import { parseSessionJson } from '@mifos/auth';
import type { SessionUser } from '@mifos/auth';

/**
 * Development-only session when login is not implemented yet.
 * Set RBAC_DEV_SESSION to JSON matching SessionUser.
 */
export function getDevSessionUser(): SessionUser | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const raw = process.env.RBAC_DEV_SESSION;
  if (!raw) {
    return null;
  }
  return parseSessionJson(raw);
}

export function isRbacEnabled(): boolean {
  return process.env.RBAC_ENABLED !== 'false';
}
