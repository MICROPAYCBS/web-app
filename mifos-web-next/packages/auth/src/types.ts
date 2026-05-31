/**
 * Session and permission types aligned with Fineract authentication response.
 */

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
  roles?: unknown;
  authenticated?: boolean;
}

export type PermissionInput = string | string[];

export interface PermissionRule {
  /** At least one Fineract permission code (OR). */
  any?: string[];
  /** All codes required (AND). */
  all?: string[];
}
