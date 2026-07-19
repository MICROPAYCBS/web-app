/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const WORKING_WEEK_DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

export type WorkingWeekDayCode = (typeof WORKING_WEEK_DAY_CODES)[number];

export const updateWorkingDaysSchema = z.object({
  weekDays: z
    .array(z.enum(WORKING_WEEK_DAY_CODES))
    .min(1, 'Select at least one working day'),
  repaymentRescheduleType: z.coerce
    .number()
    .int()
    .positive('Repayment reschedule type is required'),
  extendTermForDailyRepayments: z.boolean(),
  locale: z.string().optional()
});

export type UpdateWorkingDaysInput = z.input<typeof updateWorkingDaysSchema>;
export type UpdateWorkingDaysPayload = z.output<typeof updateWorkingDaysSchema>;

export function validateUpdateWorkingDays(input: unknown) {
  return updateWorkingDaysSchema.safeParse(input);
}
