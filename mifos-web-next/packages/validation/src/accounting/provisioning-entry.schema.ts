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

export const createProvisioningEntrySchema = z
  .object({
    date: z.string().min(1, 'Date is required.'),
    createjournalentries: z.boolean()
  })
  .merge(fineractDateContextSchema);

export type CreateProvisioningEntryInput = z.infer<typeof createProvisioningEntrySchema>;

export function validateCreateProvisioningEntry(input: unknown) {
  return createProvisioningEntrySchema.safeParse(input);
}

export function buildCreateProvisioningEntryPayload(input: CreateProvisioningEntryInput) {
  return {
    date: input.date,
    createjournalentries: input.createjournalentries,
    dateFormat: input.dateFormat,
    locale: input.locale
  };
}
