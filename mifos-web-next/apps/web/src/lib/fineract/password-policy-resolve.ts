/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { PasswordPreferenceTemplateItem } from '@mifos/api-client';
import { DEFAULT_PASSWORD_POLICY, type PasswordPolicyRules } from '@/lib/password-policy-validate';

/**
 * Fineract GET /passwordpreferences/template item.
 * Example (sandbox): simple (id 1), secure (id 2), strong (id 3, 12–50 chars).
 */
export type FineractPasswordPreference = PasswordPreferenceTemplateItem;

/** Fineract "secure" / standard tier (6+ chars, mixed case, digit, no spaces). */
const SECURE_POLICY_RULES: PasswordPolicyRules = {
  isSimplePolicy: false,
  minLength: 6,
  maxLength: 50,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: false,
  disallowSpaces: true,
  disallowConsecutiveRepeats: false,
  hint: 'Password must be 6–50 characters with uppercase, lowercase, a number, and no spaces.'
};

/** Fineract "strong" tier (12+ chars, full complexity) — matches template description. */
const STRONG_POLICY_RULES: PasswordPolicyRules = {
  ...DEFAULT_PASSWORD_POLICY,
  hint: 'Password must be 12–50 characters with uppercase, lowercase, a number, and a special character. No spaces or consecutive repeating characters.'
};

/** When Fineract "simple" is active but the app enforces stronger passwords. */
const SIMPLE_ACTIVE_STRICT_HINT = STRONG_POLICY_RULES.hint;

const WEAK_POLICY_KEYS = new Set(['simple', 'basic']);
/** Fineract uses key `secure` for the middle tier (Angular label: Standard). */
const SECURE_POLICY_KEYS = new Set(['secure', 'standard', 'medium']);

function normalizeKey(key: string | undefined): string {
  return (key ?? '').trim().toLowerCase();
}

function descriptionLower(preference: FineractPasswordPreference): string {
  return (preference.description ?? '').toLowerCase();
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
  return descriptionLower(preference).includes('at least 1 character');
}

/** Middle tier: 6 characters (Fineract key is usually `secure`). */
export function isSecurePasswordPolicy(preference: FineractPasswordPreference): boolean {
  const key = normalizeKey(preference.key);
  if (SECURE_POLICY_KEYS.has(key)) {
    return true;
  }
  if (preference.id === 2) {
    return true;
  }
  const desc = descriptionLower(preference);
  return desc.includes('at least 6 character') || desc.includes('at least 6 characters');
}

/** Strong tier: 12 characters per Fineract template (key `strong`, id 3). */
export function isStrongPasswordPolicy(preference: FineractPasswordPreference): boolean {
  const key = normalizeKey(preference.key);
  if (key === 'strong') {
    return true;
  }
  if (preference.id === 3) {
    return true;
  }
  const desc = descriptionLower(preference);
  return (
    desc.includes('12 to 50') || desc.includes('12 characters') || desc.includes('12 character')
  );
}

function findActivePreference(
  preferences: FineractPasswordPreference[]
): FineractPasswordPreference | null {
  return preferences.find((p) => p.active) ?? null;
}

function withFineractHint(
  rules: PasswordPolicyRules,
  active: FineractPasswordPreference
): PasswordPolicyRules {
  const hint = active.description?.trim();
  return hint ? { ...rules, hint } : rules;
}

/**
 * Resolves validation rules from the tenant's active password preference.
 * Uses Fineract template keys/descriptions (`simple`, `secure`, `strong`).
 * When `simple` is active, the app overrides with strong (12-char) rules.
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
      ...STRONG_POLICY_RULES,
      hint: SIMPLE_ACTIVE_STRICT_HINT
    };
  }

  if (isStrongPasswordPolicy(active)) {
    return withFineractHint(STRONG_POLICY_RULES, active);
  }

  if (isSecurePasswordPolicy(active)) {
    return withFineractHint(SECURE_POLICY_RULES, active);
  }

  return withFineractHint(DEFAULT_PASSWORD_POLICY, active);
}
