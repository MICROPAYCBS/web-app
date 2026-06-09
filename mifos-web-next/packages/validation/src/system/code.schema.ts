/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const createCodeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100)
});

export const updateCodeSchema = createCodeSchema;

export const upsertCodeValueSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  position: z.coerce.number().int().min(0, 'Position must be zero or greater'),
  isActive: z.boolean().default(false)
});

export type CreateCodeInput = z.infer<typeof createCodeSchema>;
export type UpdateCodeInput = z.infer<typeof updateCodeSchema>;
export type UpsertCodeValueInput = z.input<typeof upsertCodeValueSchema>;
export type UpsertCodeValuePayload = z.output<typeof upsertCodeValueSchema>;

export function validateCreateCode(input: unknown) {
  return createCodeSchema.safeParse(input);
}

export function validateUpdateCode(input: unknown) {
  return updateCodeSchema.safeParse(input);
}

export function validateUpsertCodeValue(input: unknown) {
  return upsertCodeValueSchema.safeParse(input);
}
