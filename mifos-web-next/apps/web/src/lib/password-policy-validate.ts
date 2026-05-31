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
