/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const LEGAL_TENDER_TYPES = ['NOTE', 'COIN'] as const;

export const legalTenderTypeSchema = z.enum(LEGAL_TENDER_TYPES);

export const upsertLegalTenderSchema = z.object({
  value: z.coerce.number().positive('Face value must be greater than zero'),
  tenderType: legalTenderTypeSchema,
  label: z.string().trim().min(1, 'Label is required').max(200),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be zero or greater'),
  active: z.boolean()
});

export type UpsertLegalTenderInput = z.input<typeof upsertLegalTenderSchema>;
export type UpsertLegalTenderPayload = z.output<typeof upsertLegalTenderSchema>;

export function validateUpsertLegalTender(input: unknown) {
  return upsertLegalTenderSchema.safeParse(input);
}
