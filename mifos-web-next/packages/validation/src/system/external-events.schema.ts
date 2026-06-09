/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updateExternalEventConfigurationSchema = z.object({
  externalEventConfigurations: z
    .record(z.string(), z.boolean())
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Select at least one event to update.'
    })
});

export type UpdateExternalEventConfigurationInput = z.infer<
  typeof updateExternalEventConfigurationSchema
>;

export function validateUpdateExternalEventConfiguration(input: unknown) {
  return updateExternalEventConfigurationSchema.safeParse(input);
}
