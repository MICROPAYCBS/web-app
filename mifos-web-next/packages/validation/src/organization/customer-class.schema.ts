/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '../clients/legal-form';

const createCustomerTypeSchema = z.enum(['GROUP', 'JOINT']);
const updateCustomerTypeSchema = z.enum(['INDIVIDUAL', 'CORPORATE', 'GROUP', 'JOINT']);
const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const kycLevelSchema = z.enum(['BASIC', 'STANDARD', 'ENHANCED']);
const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);
const legalFormIdSchema = z.coerce
  .number()
  .int()
  .refine((value) => value === LEGAL_FORM_PERSON || value === LEGAL_FORM_ENTITY, {
    message: 'Legal form must be Person or Entity'
  })
  .default(LEGAL_FORM_PERSON);

const sharedCustomerClassFields = {
  classCode: z.string().trim().min(1, 'Class code is required').max(20),
  className: z.string().trim().min(1, 'Class name is required').max(100),
  description: z.string().trim().max(255).optional(),
  legalFormId: legalFormIdSchema.default(LEGAL_FORM_PERSON),
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

function refineCustomerClassAgeRules(
  value: {
    minAge?: number;
    maxAge?: number;
    legalFormId: number;
  },
  ctx: z.RefinementCtx
) {
  if (value.minAge != null && value.maxAge != null && value.minAge > value.maxAge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum age must be greater than or equal to minimum age.',
      path: ['maxAge']
    });
  }
  if (value.legalFormId === LEGAL_FORM_ENTITY && (value.minAge != null || value.maxAge != null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Age limits apply only to Person legal form classes.',
      path: ['minAge']
    });
  }
}

export const createCustomerClassSchema = z
  .object({
    ...sharedCustomerClassFields,
    customerType: createCustomerTypeSchema.optional()
  })
  .superRefine(refineCustomerClassAgeRules);

export const updateCustomerClassSchema = z
  .object({
    ...sharedCustomerClassFields,
    customerType: updateCustomerTypeSchema.optional()
  })
  .superRefine(refineCustomerClassAgeRules);

/** @deprecated Use {@link createCustomerClassSchema} */
export const upsertCustomerClassSchema = createCustomerClassSchema;

export type UpsertCustomerClassInput = z.input<typeof createCustomerClassSchema>;
export type UpsertCustomerClassPayload = z.output<typeof createCustomerClassSchema>;
export type UpdateCustomerClassInput = z.input<typeof updateCustomerClassSchema>;
export type UpdateCustomerClassPayload = z.output<typeof updateCustomerClassSchema>;

export type CustomerClassUpdateClearFields = {
  description: boolean;
  customerType: boolean;
  riskLevel: boolean;
  kycLevel: boolean;
  restrictionId: boolean;
  minAge: boolean;
  maxAge: boolean;
};

export function validateCreateCustomerClass(input: unknown) {
  return createCustomerClassSchema.safeParse(input);
}

export function validateUpdateCustomerClass(input: unknown) {
  return updateCustomerClassSchema.safeParse(input);
}

/** @deprecated Use {@link validateCreateCustomerClass} */
export function validateUpsertCustomerClass(input: unknown) {
  return validateCreateCustomerClass(input);
}

export function parseCreateCustomerTypeField(
  value: string
): UpsertCustomerClassInput['customerType'] {
  return value === 'GROUP' || value === 'JOINT' ? value : undefined;
}

export function parseUpdateCustomerTypeField(
  value: string
): UpdateCustomerClassInput['customerType'] {
  return value === 'INDIVIDUAL' ||
    value === 'CORPORATE' ||
    value === 'GROUP' ||
    value === 'JOINT'
    ? value
    : undefined;
}

export function parseCustomerClassRiskLevelField(
  value: string
): UpsertCustomerClassInput['riskLevel'] {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' ? value : undefined;
}

export function parseCustomerClassKycLevelField(
  value: string
): UpsertCustomerClassInput['kycLevel'] {
  return value === 'BASIC' || value === 'STANDARD' || value === 'ENHANCED' ? value : undefined;
}

export function parseCustomerClassLegalFormId(value: string | number): 1 | 2 {
  const id = typeof value === 'number' ? value : Number(value);
  return id === LEGAL_FORM_ENTITY ? LEGAL_FORM_ENTITY : LEGAL_FORM_PERSON;
}

export function parseCustomerClassStatusField(value: string): 'ACTIVE' | 'INACTIVE' {
  return value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
}

export function buildUpsertCustomerClassPayload(
  input: UpsertCustomerClassPayload
): Record<string, unknown> {
  return {
    classCode: input.classCode,
    className: input.className,
    description: input.description?.trim() || undefined,
    legalFormId: input.legalFormId,
    customerType: input.customerType,
    riskLevel: input.riskLevel,
    kycLevel: input.kycLevel,
    loanEligible: input.loanEligible,
    restrictionId: input.restrictionId || undefined,
    overdraftAllowed: input.overdraftAllowed,
    enhancedDueDiligence: input.enhancedDueDiligence,
    reclassificationAllowed: input.reclassificationAllowed,
    minAge: input.minAge,
    maxAge: input.maxAge,
    enforceCustPhoto: input.enforceCustPhoto,
    enforceCustSignature: input.enforceCustSignature,
    enforceCustDocument: input.enforceCustDocument,
    autoCreateAccount: input.autoCreateAccount,
    status: input.status
  };
}

/**
 * Fineract customer class updates are patch-style: omitted keys are left unchanged.
 * Send explicit `null` to clear optional fields the user removed.
 */
export function buildUpdateCustomerClassPayload(
  input: UpdateCustomerClassPayload,
  clear: CustomerClassUpdateClearFields
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...input,
    description: input.description?.trim() || undefined,
    restrictionId: input.restrictionId || undefined
  };

  if (clear.description) {
    payload.description = null;
  }
  if (clear.customerType) {
    payload.customerType = null;
  }
  if (clear.riskLevel) {
    payload.riskLevel = null;
  }
  if (clear.kycLevel) {
    payload.kycLevel = null;
  }
  if (clear.restrictionId) {
    payload.restrictionId = null;
  }
  if (clear.minAge) {
    payload.minAge = null;
  }
  if (clear.maxAge) {
    payload.maxAge = null;
  }

  return payload;
}
