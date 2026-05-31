import 'server-only';

import { createFineractClient } from '@/lib/fineract/create-client';
import {
  DEFAULT_PASSWORD_POLICY,
  validatePasswordAgainstPolicy,
  type PasswordPolicyRules
} from '@/lib/password-policy-validate';

export type { PasswordPolicyRules };
export { validatePasswordAgainstPolicy };

/** Fineract GET /passwordpreferences/template item. */
export interface FineractPasswordPreference {
  id: number;
  description?: string;
  active?: boolean;
  key?: string;
  regex?: string;
}

const STANDARD_POLICY_RULES: PasswordPolicyRules = {
  isSimplePolicy: false,
  minLength: 6,
  maxLength: 50,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: false,
  disallowSpaces: true,
  disallowConsecutiveRepeats: false,
  hint:
    'Password must be 6–50 characters with uppercase, lowercase, a number, and no spaces.'
};

/** Shown when Fineract "simple" is active but the app enforces stronger passwords. */
const SIMPLE_ACTIVE_STRICT_HINT =
  'Password must be 12–50 characters with uppercase, lowercase, a number, and a special character. No spaces or consecutive repeating characters.';

const WEAK_POLICY_KEYS = new Set(['simple', 'basic']);
const STANDARD_POLICY_KEYS = new Set(['standard', 'medium']);

function normalizeKey(key: string | undefined): string {
  return (key ?? '').trim().toLowerCase();
}

/** True when this template row is Fineract's weakest (simple/basic) policy. */
export function isWeakestPasswordPolicy(preference: FineractPasswordPreference): boolean {
  const key = normalizeKey(preference.key);
  if (WEAK_POLICY_KEYS.has(key)) {
    return true;
  }
  if (preference.id === 1) {
    return true;
  }
  const description = (preference.description ?? '').toLowerCase();
  return description.includes('at least 1 character');
}

function isStandardPasswordPolicy(preference: FineractPasswordPreference): boolean {
  const key = normalizeKey(preference.key);
  if (STANDARD_POLICY_KEYS.has(key)) {
    return true;
  }
  if (preference.id === 2) {
    return true;
  }
  const description = (preference.description ?? '').toLowerCase();
  return description.includes('at least 6 character');
}

function findActivePreference(
  preferences: FineractPasswordPreference[]
): FineractPasswordPreference | null {
  const active = preferences.find((p) => p.active);
  if (active) {
    return active;
  }
  return preferences[0] ?? null;
}

/**
 * Resolves validation rules from the tenant's active password preference.
 * When simple/basic is active, the app overrides Fineract's weak policy with strict rules.
 * Standard and strong policies use rules aligned with Fineract descriptions.
 */
export function rulesForActivePasswordPreference(
  preferences: FineractPasswordPreference[]
): PasswordPolicyRules {
  const active = findActivePreference(preferences);
  if (!active) {
    return DEFAULT_PASSWORD_POLICY;
  }
  if (isWeakestPasswordPolicy(active)) {
    return {
      ...DEFAULT_PASSWORD_POLICY,
      hint: SIMPLE_ACTIVE_STRICT_HINT
    };
  }
  if (isStandardPasswordPolicy(active)) {
    return {
      ...STANDARD_POLICY_RULES,
      hint: active.description?.trim() || STANDARD_POLICY_RULES.hint
    };
  }
  return {
    ...DEFAULT_PASSWORD_POLICY,
    hint: active.description?.trim() || DEFAULT_PASSWORD_POLICY.hint
  };
}

export async function fetchActivePasswordPolicyRules(): Promise<PasswordPolicyRules> {
  const fineract = await createFineractClient();
  const preferences = await fineract.get<FineractPasswordPreference[]>(
    '/passwordpreferences/template'
  );
  return rulesForActivePasswordPreference(Array.isArray(preferences) ? preferences : []);
}
