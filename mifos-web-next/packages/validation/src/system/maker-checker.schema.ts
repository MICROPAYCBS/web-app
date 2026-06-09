/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updateMakerCheckerPermissionsSchema = z.object({
  permissions: z
    .record(z.string(), z.boolean())
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Select at least one task state to update.'
    })
});

export type UpdateMakerCheckerPermissionsInput = z.infer<
  typeof updateMakerCheckerPermissionsSchema
>;

export function validateUpdateMakerCheckerPermissions(input: unknown) {
  return updateMakerCheckerPermissionsSchema.safeParse(input);
}
