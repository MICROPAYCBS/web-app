/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updatePasswordPreferencesSchema = z.object({
  validationPolicyId: z.coerce
    .number()
    .int()
    .positive('Password validation policy is required')
});

export type UpdatePasswordPreferencesInput = z.input<typeof updatePasswordPreferencesSchema>;
export type UpdatePasswordPreferencesPayload = z.output<typeof updatePasswordPreferencesSchema>;

export function validateUpdatePasswordPreferences(input: unknown) {
  return updatePasswordPreferencesSchema.safeParse(input);
}
