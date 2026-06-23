/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const customerTypeSchema = z.enum(['INDIVIDUAL', 'CORPORATE', 'GROUP', 'JOINT']);
const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const kycLevelSchema = z.enum(['BASIC', 'STANDARD', 'ENHANCED']);
const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const customerClassFields = {
  classCode: z.string().trim().min(1, 'Class code is required').max(20),
  className: z.string().trim().min(1, 'Class name is required').max(100),
  description: z.string().trim().max(255).optional(),
  customerType: customerTypeSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  kycLevel: kycLevelSchema.optional(),
  loanEligible: z.boolean().default(true),
  restrictionId: z.coerce.number().int().positive().optional(),
  overdraftAllowed: z.boolean().default(false),
  enhancedDueDiligence: z.boolean().default(false),
  reclassificationAllowed: z.boolean().default(true),
  minAge: z.coerce.number().int().min(0).optional(),
  maxAge: z.coerce.number().int().positive().optional(),
  enforceCustPhoto: z.boolean().default(true),
  enforceCustSignature: z.boolean().default(true),
  enforceCustDocument: z.boolean().default(true),
  autoCreateAccount: z.boolean().default(false),
  status: statusSchema.default('ACTIVE')
};

export const upsertCustomerClassSchema = z
  .object(customerClassFields)
  .superRefine((value, ctx) => {
    if (value.minAge != null && value.maxAge != null && value.minAge > value.maxAge) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum age must be greater than or equal to minimum age.',
        path: ['maxAge']
      });
    }
  });

export type UpsertCustomerClassInput = z.input<typeof upsertCustomerClassSchema>;
export type UpsertCustomerClassPayload = z.output<typeof upsertCustomerClassSchema>;

export function validateUpsertCustomerClass(input: unknown) {
  return upsertCustomerClassSchema.safeParse(input);
}

export function buildUpsertCustomerClassPayload(
  input: UpsertCustomerClassPayload
): UpsertCustomerClassPayload {
  return {
    ...input,
    description: input.description?.trim() || undefined,
    restrictionId: input.restrictionId || undefined
  };
}
