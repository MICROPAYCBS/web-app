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
  .transform((v) => (v === '' ? undefined : v));

const optionalNonNegativeInt = z
  .union([z.coerce.number().int().min(0), z.literal('')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? undefined : value));

const shareAccountChargeItemSchema = z.object({
  chargeId: z.coerce.number().int().positive('Select a charge.'),
  amount: z.coerce.number().positive('Charge amount must be greater than zero.')
});

/**
 * Create share account application.
 * Source: ShareAccountDataSerializer.validateAndCreate / ShareAccountApiConstants.
 */
export const createShareAccountSchema = z
  .object({
    productId: z.coerce.number().int().positive('Select a product.'),
    submittedDate: z.string().trim().min(1, 'Submitted date is required.'),
    externalId: z.string().trim().max(100).optional().or(z.literal('')),
    requestedShares: z.coerce.number().int().positive('Requested shares must be greater than zero.'),
    savingsAccountId: z.coerce.number().int().positive('Select a savings account.'),
    applicationDate: z.string().trim().min(1, 'Application date is required.'),
    minimumActivePeriod: optionalNonNegativeInt,
    minimumActivePeriodFrequencyType: optionalId,
    lockinPeriodFrequency: optionalNonNegativeInt,
    lockinPeriodFrequencyType: optionalId,
    allowDividendCalculationForInactiveClients: z.boolean().optional(),
    /**
     * When true, available balance is checked at apply and funds are withdrawn from the
     * linked savings account on approval. Default / omitted = cash-funded.
     */
    useSavings: z.boolean().optional(),
    charges: z.array(shareAccountChargeItemSchema).optional()
  })
  .superRefine((data, ctx) => {
    if (data.minimumActivePeriod != null && data.minimumActivePeriodFrequencyType == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a frequency type.',
        path: ['minimumActivePeriodFrequencyType']
      });
    }
    if (data.lockinPeriodFrequency != null && data.lockinPeriodFrequencyType == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a lock-in frequency type.',
        path: ['lockinPeriodFrequencyType']
      });
    }
  });

/** Pending application modify — same writable fields as create (no clientId). */
export const updateShareAccountSchema = createShareAccountSchema;

export type CreateShareAccountInput = z.infer<typeof createShareAccountSchema>;
export type UpdateShareAccountInput = z.infer<typeof updateShareAccountSchema>;
export type ShareAccountChargeItemInput = z.infer<typeof shareAccountChargeItemSchema>;
