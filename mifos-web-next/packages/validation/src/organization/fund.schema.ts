/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const fundFields = {
  name: z.string().trim().min(1, 'Name is required').max(100),
  externalId: z.string().trim().optional().or(z.literal(''))
};

export const createFundSchema = z.object(fundFields);
export const updateFundSchema = z.object(fundFields);

export type CreateFundInput = z.input<typeof createFundSchema>;
export type CreateFundPayload = z.output<typeof createFundSchema>;
export type UpdateFundInput = z.input<typeof updateFundSchema>;
export type UpdateFundPayload = z.output<typeof updateFundSchema>;

export function validateCreateFund(input: unknown) {
  return createFundSchema.safeParse(input);
}

export function validateUpdateFund(input: unknown) {
  return updateFundSchema.safeParse(input);
}

export function buildFundPayload(input: CreateFundPayload | UpdateFundPayload) {
  return {
    name: input.name,
    ...(input.externalId?.trim() ? { externalId: input.externalId.trim() } : {})
  };
}
