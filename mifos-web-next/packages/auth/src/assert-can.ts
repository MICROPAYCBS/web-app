import { can } from './can';
import type { PermissionInput, PermissionRule, SessionUser } from './types';

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Use in Server Actions before calling Fineract. */
export function assertCan(
  user: SessionUser | null | undefined,
  permission: PermissionInput | PermissionRule
): asserts user is SessionUser {
  if (!user || !can(user, permission)) {
    throw new ForbiddenError();
  }
}
