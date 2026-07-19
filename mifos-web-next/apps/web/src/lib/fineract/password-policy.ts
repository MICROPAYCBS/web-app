import 'server-only';

import { createFineractClient } from '@/lib/fineract/create-client';
import {
  validatePasswordAgainstPolicy,
  type PasswordPolicyRules
} from '@/lib/password-policy-validate';
import {
  rulesForActivePasswordPreference,
  type FineractPasswordPreference
} from '@/lib/fineract/password-policy-resolve';

export type { PasswordPolicyRules } from '@/lib/password-policy-validate';
export type { FineractPasswordPreference } from '@/lib/fineract/password-policy-resolve';
export {
  isSecurePasswordPolicy,
  isStrongPasswordPolicy,
  isWeakestPasswordPolicy,
  rulesForActivePasswordPreference
} from '@/lib/fineract/password-policy-resolve';
export { validatePasswordAgainstPolicy };

export async function fetchActivePasswordPolicyRules(): Promise<PasswordPolicyRules> {
  const fineract = await createFineractClient();
  const preferences = await fineract.get<FineractPasswordPreference[]>(
    '/passwordpreferences/template'
  );
  return rulesForActivePasswordPreference(Array.isArray(preferences) ? preferences : []);
}
