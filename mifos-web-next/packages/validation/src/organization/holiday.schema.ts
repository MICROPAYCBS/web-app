/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/** Legacy: reschedule repayments to the next repayment date. */
export const HOLIDAY_RESCHEDULE_NEXT_REPAYMENT = 1;
/** Legacy: reschedule repayments to a specific date. */
export const HOLIDAY_RESCHEDULE_SPECIFIC_DATE = 2;

const fineractDate = z.string().trim().min(1, 'Date is required');
const optionalText = z.string().trim().optional();

const reschedulingRefine = (
  data: { reschedulingType?: number; repaymentsRescheduledTo?: string },
  ctx: z.RefinementCtx
) => {
  if (
    data.reschedulingType === HOLIDAY_RESCHEDULE_SPECIFIC_DATE &&
    !data.repaymentsRescheduledTo?.trim()
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Repayment date is required',
      path: ['repaymentsRescheduledTo']
    });
  }
};

export const createHolidaySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    fromDate: fineractDate,
    toDate: fineractDate,
    reschedulingType: z.coerce.number().int().positive('Repayment scheduling type is required'),
    repaymentsRescheduledTo: fineractDate.optional().or(z.literal('')),
    description: optionalText,
    offices: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one branch'),
    locale: z.string().optional(),
    dateFormat: z.string().optional()
  })
  .superRefine(reschedulingRefine);

export const updateActiveHolidaySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: optionalText,
  locale: z.string().optional(),
  dateFormat: z.string().optional()
});

export const updatePendingHolidaySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    fromDate: fineractDate,
    toDate: fineractDate,
    reschedulingType: z.coerce.number().int().positive('Repayment scheduling type is required'),
    repaymentsRescheduledTo: fineractDate.optional().or(z.literal('')),
    description: optionalText,
    locale: z.string().optional(),
    dateFormat: z.string().optional()
  })
  .superRefine(reschedulingRefine);

export type CreateHolidayInput = z.input<typeof createHolidaySchema>;
export type CreateHolidayPayload = z.output<typeof createHolidaySchema>;
export type UpdateActiveHolidayInput = z.input<typeof updateActiveHolidaySchema>;
export type UpdateActiveHolidayPayload = z.output<typeof updateActiveHolidaySchema>;
export type UpdatePendingHolidayInput = z.input<typeof updatePendingHolidaySchema>;
export type UpdatePendingHolidayPayload = z.output<typeof updatePendingHolidaySchema>;

export function validateCreateHoliday(input: unknown) {
  return createHolidaySchema.safeParse(input);
}

export function validateUpdateActiveHoliday(input: unknown) {
  return updateActiveHolidaySchema.safeParse(input);
}

export function validateUpdatePendingHoliday(input: unknown) {
  return updatePendingHolidaySchema.safeParse(input);
}
