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

const SIMPLE_POLICY_RULES: PasswordPolicyRules = {
  isSimplePolicy: true,
  minLength: 1,
  maxLength: 50,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: false,
  requireSpecialChar: false,
  disallowSpaces: false,
  disallowConsecutiveRepeats: false,
  hint: 'Password must be 1–50 characters.'
};

const WEAK_POLICY_KEYS = new Set(['simple', 'basic']);

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
 * When the active policy is simple/basic, Fineract's weak rules apply.
 * Otherwise the stricter default (legacy web-app) rules apply.
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
      ...SIMPLE_POLICY_RULES,
      hint: active.description?.trim() || SIMPLE_POLICY_RULES.hint
    };
  }
  return DEFAULT_PASSWORD_POLICY;
}

export async function fetchActivePasswordPolicyRules(): Promise<PasswordPolicyRules> {
  const fineract = await createFineractClient();
  const preferences = await fineract.get<FineractPasswordPreference[]>(
    '/passwordpreferences/template'
  );
  return rulesForActivePasswordPreference(Array.isArray(preferences) ? preferences : []);
}
