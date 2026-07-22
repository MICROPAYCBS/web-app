/**
 * Session and permission types aligned with Fineract authentication response.
 */

/** Role assigned to the signed-in user (from POST /authentication `roles`). */
export interface SessionRole {
  id: number;
  name: string;
}

export interface SessionUser {
  userId: number;
  username: string;
  officeId: number;
  officeName?: string;
  /** First name from Fineract user profile (when loaded). */
  firstName?: string;
  /** Last name from Fineract user profile (when loaded). */
  lastName?: string;
  /** Full name for display; falls back to username when not set. */
  displayName?: string;
  permissions: string[];
  /** Roles from the authentication payload. */
  roles?: SessionRole[];
  authenticated?: boolean;
  /** Minutes until idle sign-out (from login / userdetails). */
  sessionIdleTimeoutMinutes?: number;
  /** Warning period before idle sign-out, in seconds. */
  sessionIdleWarningSeconds?: number;
}

export type PermissionInput = string | string[];

export interface PermissionRule {
  /** At least one Fineract permission code (OR). */
  any?: string[];
  /** All codes required (AND). */
  all?: string[];
}
