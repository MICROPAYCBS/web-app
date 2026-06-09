/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' ? undefined : value));

export const upsertChargeSchema = z
  .object({
    chargeAppliesTo: z.coerce.number().int().positive('Applies to is required.'),
    name: z.string().trim().min(1, 'Name is required.').max(100),
    currencyCode: z.string().trim().min(1, 'Select a currency.').max(3),
    chargeTimeType: z.coerce.number().int().min(0, 'Charge time type is required.'),
    chargeCalculationType: z.coerce.number().int().min(0, 'Calculation type is required.'),
    amount: z.coerce.number().positive('Amount must be greater than zero.'),
    active: z.boolean().default(false),
    penalty: z.boolean().default(false),
    chargePaymentMode: z.coerce.number().int().min(0).optional(),
    incomeAccountId: optionalId,
    taxGroupId: optionalId,
    minCap: z.coerce.number().min(0).optional(),
    maxCap: z.coerce.number().min(0).optional(),
    feeInterval: z.coerce.number().int().positive().optional(),
    feeFrequency: z.coerce.number().int().min(0).optional(),
    feeOnMonthDay: z.string().trim().optional(),
    addFeeFrequency: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.chargeAppliesTo === 1 || data.chargeAppliesTo === 5) {
      if (data.chargePaymentMode == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Payment mode is required.',
          path: ['chargePaymentMode']
        });
      }
    }

    if (data.chargeAppliesTo === 3 && !data.incomeAccountId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Income account is required for client charges.',
        path: ['incomeAccountId']
      });
    }

    if (data.chargeTimeType === 6 && !data.feeOnMonthDay?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date is required.',
        path: ['feeOnMonthDay']
      });
    }

    if (data.chargeTimeType === 7) {
      if (!data.feeInterval) {
        ctx.addIssue({
          code: 'custom',
          message: 'Repeat every is required.',
          path: ['feeInterval']
        });
      } else if (data.feeInterval > 12) {
        ctx.addIssue({
          code: 'custom',
          message: 'Repeat every must be between 1 and 12 months.',
          path: ['feeInterval']
        });
      }
    }

    if (data.chargeTimeType === 11 && !data.feeInterval) {
      ctx.addIssue({
        code: 'custom',
        message: 'Repeat every is required.',
        path: ['feeInterval']
      });
    }

    if (data.chargeTimeType === 9 && data.addFeeFrequency) {
      if (data.feeFrequency == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Charge frequency is required.',
          path: ['feeFrequency']
        });
      }
      if (!data.feeInterval) {
        ctx.addIssue({
          code: 'custom',
          message: 'Frequency interval is required.',
          path: ['feeInterval']
        });
      }
    }

    if (data.minCap != null && data.maxCap != null && data.minCap > data.maxCap) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimum cap cannot exceed maximum cap.',
        path: ['minCap']
      });
    }
  });

export type UpsertChargeInput = z.infer<typeof upsertChargeSchema>;
