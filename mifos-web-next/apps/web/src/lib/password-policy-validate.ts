/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Mirrors {@link PasswordPolicyRules} from password-policy.ts (client-safe). */
export interface PasswordPolicyRules {
  isSimplePolicy: boolean;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  disallowSpaces: boolean;
  disallowConsecutiveRepeats: boolean;
  hint: string;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyRules = {
  isSimplePolicy: false,
  minLength: 12,
  maxLength: 50,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  disallowSpaces: true,
  disallowConsecutiveRepeats: true,
  hint:
    'Password must be 12–50 characters with uppercase, lowercase, a number, and a special character. No spaces or consecutive repeating characters.'
};

export type PasswordPolicyCheckId =
  | 'minLength'
  | 'maxLength'
  | 'uppercase'
  | 'lowercase'
  | 'digit'
  | 'specialChar'
  | 'noSpaces'
  | 'noConsecutiveRepeats';

export interface PasswordPolicyCheck {
  id: PasswordPolicyCheckId;
  label: string;
  met: boolean;
}

/** Human-readable checklist derived from the active Fineract password preference. */
export function buildPasswordPolicyChecks(
  password: string,
  rules: PasswordPolicyRules
): PasswordPolicyCheck[] {
  const checks: PasswordPolicyCheck[] = [
    {
      id: 'minLength',
      label: `At least ${rules.minLength} characters`,
      met: password.length >= rules.minLength
    }
  ];

  if (rules.maxLength < Number.MAX_SAFE_INTEGER) {
    checks.push({
      id: 'maxLength',
      label: `No more than ${rules.maxLength} characters`,
      met: password.length <= rules.maxLength
    });
  }

  if (rules.requireUppercase) {
    checks.push({
      id: 'uppercase',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password)
    });
  }

  if (rules.requireLowercase) {
    checks.push({
      id: 'lowercase',
      label: 'One lowercase letter',
      met: /[a-z]/.test(password)
    });
  }

  if (rules.requireDigit) {
    checks.push({
      id: 'digit',
      label: 'One number',
      met: /\d/.test(password)
    });
  }

  if (rules.requireSpecialChar) {
    checks.push({
      id: 'specialChar',
      label: 'One special character',
      met: /[^\w\s]/.test(password)
    });
  }

  if (rules.disallowSpaces) {
    checks.push({
      id: 'noSpaces',
      label: 'No spaces',
      met: password.length === 0 || !/\s/.test(password)
    });
  }

  if (rules.disallowConsecutiveRepeats) {
    checks.push({
      id: 'noConsecutiveRepeats',
      label: 'No consecutive repeating characters',
      met: password.length === 0 || !/(.)\1/.test(password)
    });
  }

  return checks;
}

export function allPasswordPolicyChecksMet(checks: PasswordPolicyCheck[]): boolean {
  return checks.every((check) => check.met);
}

export function passwordMeetsPolicy(password: string, rules: PasswordPolicyRules): boolean {
  if (!password) {
    return false;
  }
  return allPasswordPolicyChecksMet(buildPasswordPolicyChecks(password, rules));
}

export function validatePasswordAgainstPolicy(
  password: string,
  rules: PasswordPolicyRules
): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < rules.minLength) {
    return `Password must be at least ${rules.minLength} characters`;
  }
  if (password.length > rules.maxLength) {
    return `Password must be at most ${rules.maxLength} characters`;
  }
  if (rules.disallowSpaces && /\s/.test(password)) {
    return 'Password must not contain spaces';
  }
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (rules.requireDigit && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (rules.requireSpecialChar && !/[^\w\s]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  if (rules.disallowConsecutiveRepeats && /(.)\1/.test(password)) {
    return 'Password must not have consecutive repeating characters';
  }
  return null;
}
