/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const fineractDate = z.string().trim().min(1, 'Opening date is required');

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const branchProfileSchema = z.object({
  officeCode: optionalText(10),
  branchType: optionalText(30),
  regionCode: optionalText(20),
  address: optionalText(255),
  city: optionalText(50),
  countryCode: optionalText(10),
  phoneNo: optionalText(30),
  emailAddress: optionalText(100),
  managerStaffId: z.coerce.number().int().positive().optional(),
  swiftCode: optionalText(30),
  latitude: optionalText(50),
  longitude: optionalText(50),
  cashLimit: z.coerce.number().nonnegative().optional(),
  workingHours: optionalText(20),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

const officeBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  openingDate: fineractDate,
  externalId: z.string().trim().optional().or(z.literal('')),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  branchProfile: branchProfileSchema.optional()
});

export const createOfficeSchema = officeBaseSchema.extend({
  parentId: z.coerce.number().int().positive('Parent branch is required')
});

export const updateOfficeSchema = officeBaseSchema.extend({
  parentId: z.coerce.number().int().positive('Parent branch is required').optional()
});

export type BranchProfileInput = z.input<typeof branchProfileSchema>;
export type BranchProfilePayload = z.output<typeof branchProfileSchema>;
export type CreateOfficeInput = z.input<typeof createOfficeSchema>;
export type CreateOfficePayload = z.output<typeof createOfficeSchema>;
export type UpdateOfficeInput = z.input<typeof updateOfficeSchema>;
export type UpdateOfficePayload = z.output<typeof updateOfficeSchema>;

export function validateCreateOffice(input: unknown) {
  return createOfficeSchema.safeParse(input);
}

export function validateUpdateOffice(input: unknown) {
  return updateOfficeSchema.safeParse(input);
}
