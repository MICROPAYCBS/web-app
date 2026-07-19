/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { optionalUgandaMobileInternationalSchema } from '../uganda-mobile';

const staffNamePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);

const staffBaseSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  firstname: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50)
    .regex(staffNamePattern, {
      message: 'First name cannot begin with a number or special character'
    }),
  lastname: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50)
    .regex(staffNamePattern, {
      message: 'Last name cannot begin with a number or special character'
    }),
  isLoanOfficer: z.boolean().default(false),
  mobileNo: optionalUgandaMobileInternationalSchema.optional(),
  joiningDate: fineractDate,
  dateFormat: z.string().optional(),
  locale: z.string().optional()
});

export const createStaffSchema = staffBaseSchema;

export const updateStaffSchema = staffBaseSchema.extend({
  isActive: z.boolean()
});

export type CreateStaffInput = z.input<typeof createStaffSchema>;
export type CreateStaffPayload = z.output<typeof createStaffSchema>;
export type UpdateStaffInput = z.input<typeof updateStaffSchema>;
export type UpdateStaffPayload = z.output<typeof updateStaffSchema>;

export function validateCreateStaff(input: unknown) {
  return createStaffSchema.safeParse(input);
}

export function validateUpdateStaff(input: unknown) {
  return updateStaffSchema.safeParse(input);
}
