/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const taxGroupMemberSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  taxComponentId: z.coerce.number().int().positive('Select a tax component.'),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  isNew: z.boolean().optional()
});

export const upsertTaxGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  taxComponents: z
    .array(taxGroupMemberSchema)
    .min(1, 'Add at least one tax component.')
});

export type TaxGroupMemberInput = z.infer<typeof taxGroupMemberSchema>;
export type UpsertTaxGroupInput = z.infer<typeof upsertTaxGroupSchema>;
