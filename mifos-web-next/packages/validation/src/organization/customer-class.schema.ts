/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '../clients/legal-form';
import {
  booleansEqual,
  EmptyUpdatePayloadError,
  optionalIdsEqual,
  trimOptionalString
} from '../partial-update';

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

function putRequiredString(
  payload: Record<string, unknown>,
  key: string,
  current: string,
  initial: string
): void {
  if (trimOptionalString(current) === trimOptionalString(initial)) {
    return;
  }
  payload[key] = trimOptionalString(current);
}

function putOptionalStringOrNull(
  payload: Record<string, unknown>,
  key: string,
  current: string | undefined,
  initial: string | undefined
): void {
  const currentValue = trimOptionalString(current);
  const initialValue = trimOptionalString(initial);
  if (currentValue === initialValue) {
    return;
  }
  payload[key] = currentValue === '' ? null : currentValue;
}

function putOptionalIdOrNull(
  payload: Record<string, unknown>,
  key: string,
  current: number | undefined,
  initial: number | undefined
): void {
  if (optionalIdsEqual(current, initial)) {
    return;
  }
  payload[key] = current ?? null;
}

function putOptionalEnumOrNull<T extends string>(
  payload: Record<string, unknown>,
  key: string,
  current: T | undefined,
  initial: T | undefined
): void {
  if (current === initial) {
    return;
  }
  payload[key] = current ?? null;
}

function putBooleanIfChanged(
  payload: Record<string, unknown>,
  key: string,
  current: boolean | undefined,
  initial: boolean | undefined
): void {
  if (booleansEqual(current, initial)) {
    return;
  }
  payload[key] = current ?? false;
}

/**
 * Fineract customer class updates are patch-style: omitted keys are left unchanged.
 * Returns `null` when there is nothing to send.
 */
export function diffUpdateCustomerClassPayload(
  input: UpdateCustomerClassPayload,
  options: { initial: UpdateCustomerClassPayload }
): Record<string, unknown> | null {
  const { initial } = options;
  const payload: Record<string, unknown> = {};

  putRequiredString(payload, 'classCode', input.classCode, initial.classCode);
  putRequiredString(payload, 'className', input.className, initial.className);
  putOptionalStringOrNull(payload, 'description', input.description, initial.description);

  if (input.legalFormId !== initial.legalFormId) {
    payload.legalFormId = input.legalFormId;
  }

  putOptionalEnumOrNull(payload, 'customerType', input.customerType, initial.customerType);
  putOptionalEnumOrNull(payload, 'riskLevel', input.riskLevel, initial.riskLevel);
  putOptionalEnumOrNull(payload, 'kycLevel', input.kycLevel, initial.kycLevel);
  putOptionalIdOrNull(payload, 'restrictionId', input.restrictionId, initial.restrictionId);

  putBooleanIfChanged(payload, 'loanEligible', input.loanEligible, initial.loanEligible);
  putBooleanIfChanged(payload, 'overdraftAllowed', input.overdraftAllowed, initial.overdraftAllowed);
  putBooleanIfChanged(
    payload,
    'enhancedDueDiligence',
    input.enhancedDueDiligence,
    initial.enhancedDueDiligence
  );
  putBooleanIfChanged(
    payload,
    'reclassificationAllowed',
    input.reclassificationAllowed,
    initial.reclassificationAllowed
  );
  putBooleanIfChanged(payload, 'enforceCustPhoto', input.enforceCustPhoto, initial.enforceCustPhoto);
  putBooleanIfChanged(
    payload,
    'enforceCustSignature',
    input.enforceCustSignature,
    initial.enforceCustSignature
  );
  putBooleanIfChanged(
    payload,
    'enforceCustDocument',
    input.enforceCustDocument,
    initial.enforceCustDocument
  );
  putBooleanIfChanged(payload, 'autoCreateAccount', input.autoCreateAccount, initial.autoCreateAccount);

  if (input.status !== initial.status) {
    payload.status = input.status;
  }

  const isPerson = input.legalFormId === LEGAL_FORM_PERSON;
  const wasPerson = initial.legalFormId === LEGAL_FORM_PERSON;

  if (isPerson) {
    putOptionalIdOrNull(payload, 'minAge', input.minAge, initial.minAge);
    putOptionalIdOrNull(payload, 'maxAge', input.maxAge, initial.maxAge);
  } else if (wasPerson && !isPerson) {
    if (initial.minAge != null) {
      payload.minAge = null;
    }
    if (initial.maxAge != null) {
      payload.maxAge = null;
    }
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

export function hasUpdateCustomerClassChanges(
  input: UpdateCustomerClassInput,
  options: { initial: UpdateCustomerClassInput }
): boolean {
  return (
    diffUpdateCustomerClassPayload(input as UpdateCustomerClassPayload, {
      initial: options.initial as UpdateCustomerClassPayload
    }) !== null
  );
}

/**
 * Fineract customer class updates are patch-style: omitted keys are left unchanged.
 * Send explicit `null` to clear optional fields the user removed.
 */
export function buildUpdateCustomerClassPayload(
  input: UpdateCustomerClassPayload,
  options: { initial: UpdateCustomerClassPayload }
): Record<string, unknown> {
  const payload = diffUpdateCustomerClassPayload(input, options);
  if (!payload) {
    throw new EmptyUpdatePayloadError('No customer class fields were modified.');
  }
  return payload;
}
