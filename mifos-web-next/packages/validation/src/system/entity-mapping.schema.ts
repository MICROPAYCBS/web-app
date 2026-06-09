/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const fineractDateContextSchema = z.object({
  dateFormat: z.string().min(1),
  locale: z.string().min(1)
});

export const upsertEntityMappingSchema = z
  .object({
    fromId: z.coerce.number().int().positive('Select a source entity.'),
    toId: z.coerce.number().int().positive('Select a target entity.'),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
  .merge(fineractDateContextSchema);

export type UpsertEntityMappingInput = z.infer<typeof upsertEntityMappingSchema>;

export function validateUpsertEntityMapping(input: unknown) {
  return upsertEntityMappingSchema.safeParse(input);
}
