/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const positiveId = z.coerce.number().int().positive();

export const createStandingInstructionSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(200),
    transferType: positiveId,
    priority: positiveId,
    status: positiveId,
    fromAccountType: positiveId,
    fromAccountId: positiveId,
    destination: z.coerce.number().int().min(1).max(2),
    toOfficeId: positiveId,
    toClientId: positiveId,
    toAccountType: positiveId,
    toAccountId: positiveId,
    instructionType: positiveId,
    amount: z.coerce.number().positive().optional(),
    validFrom: requiredDate,
    validTill: requiredDate,
    recurrenceType: positiveId,
    recurrenceInterval: z.coerce.number().int().positive().optional(),
    recurrenceFrequency: positiveId.optional(),
    recurrenceOnMonthDay: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    if (data.instructionType === 1 && data.amount === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Amount is required for this instruction type.',
        path: ['amount']
      });
    }
    if (data.recurrenceType === 1) {
      if (data.recurrenceInterval === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Interval is required for periodic recurrence.',
          path: ['recurrenceInterval']
        });
      }
      if (data.recurrenceFrequency === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Recurrence frequency is required.',
          path: ['recurrenceFrequency']
        });
      }
      const freq = data.recurrenceFrequency;
      if (
        (freq === 2 || freq === 3) &&
        (!data.recurrenceOnMonthDay || !data.recurrenceOnMonthDay.trim())
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'On month day is required for this frequency.',
          path: ['recurrenceOnMonthDay']
        });
      }
    }
  });

export type CreateStandingInstructionInput = z.infer<typeof createStandingInstructionSchema>;
