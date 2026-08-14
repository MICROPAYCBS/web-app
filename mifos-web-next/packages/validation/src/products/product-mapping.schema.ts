/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const DUPLICATE_PAYMENT_CHANNEL_MAPPING_MESSAGE =
  'This payment channel is already mapped.';
export const DUPLICATE_CHARGE_MAPPING_MESSAGE = 'This charge is already mapped.';

export const paymentChannelMappingSchema = z.object({
  paymentTypeId: z.coerce.number().int().positive(),
  fundSourceAccountId: z.coerce.number().int().positive()
});

export const chargeIncomeMappingSchema = z.object({
  chargeId: z.coerce.number().int().positive(),
  incomeAccountId: z.coerce.number().int().positive()
});

/** Plain object so product accounting schemas can `.merge()` it (ZodEffects cannot merge). */
export const productMappingsObjectSchema = z.object({
  paymentChannelToFundSourceMappings: z.array(paymentChannelMappingSchema).optional(),
  feeToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional(),
  penaltyToIncomeAccountMappings: z.array(chargeIncomeMappingSchema).optional()
});

export const productMappingsStepSchema = productMappingsObjectSchema.superRefine((data, ctx) =>
  refineProductMappingUniqueness(data, ctx)
);

export type ProductMappingFields = {
  paymentChannelToFundSourceMappings?: Array<{
    paymentTypeId?: number;
    fundSourceAccountId?: number;
  }>;
  feeToIncomeAccountMappings?: Array<{ chargeId?: number; incomeAccountId?: number }>;
  penaltyToIncomeAccountMappings?: Array<{ chargeId?: number; incomeAccountId?: number }>;
};

export function refineUniqueMappingKey(
  rows: Array<Record<string, unknown>> | undefined,
  key: string,
  ctx: z.RefinementCtx,
  arrayPath: Array<string | number>,
  message: string
): void {
  if (!rows?.length) {
    return;
  }
  const seen = new Set<number>();
  rows.forEach((row, index) => {
    const id = Number(row[key]);
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }
    if (seen.has(id)) {
      ctx.addIssue({
        code: 'custom',
        message,
        path: [...arrayPath, index, key]
      });
      return;
    }
    seen.add(id);
  });
}

/** One fund-source / income GL per payment channel or charge. Empty ids (draft rows) are ignored. */
export function refineProductMappingUniqueness(
  data: ProductMappingFields,
  ctx: z.RefinementCtx,
  pathPrefix: Array<string | number> = []
): void {
  refineUniqueMappingKey(
    data.paymentChannelToFundSourceMappings as Array<Record<string, unknown>> | undefined,
    'paymentTypeId',
    ctx,
    [...pathPrefix, 'paymentChannelToFundSourceMappings'],
    DUPLICATE_PAYMENT_CHANNEL_MAPPING_MESSAGE
  );
  refineUniqueMappingKey(
    data.feeToIncomeAccountMappings as Array<Record<string, unknown>> | undefined,
    'chargeId',
    ctx,
    [...pathPrefix, 'feeToIncomeAccountMappings'],
    DUPLICATE_CHARGE_MAPPING_MESSAGE
  );
  refineUniqueMappingKey(
    data.penaltyToIncomeAccountMappings as Array<Record<string, unknown>> | undefined,
    'chargeId',
    ctx,
    [...pathPrefix, 'penaltyToIncomeAccountMappings'],
    DUPLICATE_CHARGE_MAPPING_MESSAGE
  );
}
