/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/** `guarantorType` code values. Ids are stable in Fineract. */
export const GUARANTOR_TYPE_CUSTOMER = 1;
export const GUARANTOR_TYPE_STAFF = 2;
export const GUARANTOR_TYPE_EXTERNAL = 3;
export const GUARANTOR_TYPE_GROUP = 4;

const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' ? undefined : value));

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

const optionalPhone = z
  .string()
  .trim()
  .max(20, 'Phone numbers must be 20 characters or fewer.')
  .optional()
  .or(z.literal(''))
  .transform((value) => (value == null || value === '' ? undefined : value))
  .refine((value) => value == null || /^\+?[0-9. ()-]{0,25}$/.test(value), {
    message: 'Enter a valid phone number.'
  });

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value == null || value === '' ? undefined : value));

export const loanGuarantorItemSchema = z
  .object({
    guarantorTypeId: z.coerce.number().int().positive('Select a guarantor type.'),
    entityId: optionalId,
    clientRelationshipTypeId: optionalId,
    savingsId: optionalId,
    amount: z.preprocess(
      (value) => (value === '' || value == null ? undefined : value),
      z.coerce.number().positive('Amount must be greater than zero.').optional()
    ),
    firstname: optionalText(50),
    lastname: optionalText(50),
    nationalIdNumber: optionalText(50),
    addressLine1: optionalText(500),
    addressLine2: optionalText(500),
    city: optionalText(50),
    state: optionalText(50),
    country: optionalText(50),
    zip: optionalText(20),
    mobileNumber: optionalPhone,
    housePhoneNumber: optionalPhone,
    comment: optionalText(500),
    dob: optionalDate,
    /** Display name of a searched customer. Not sent to the server. */
    entityLabel: z.string().trim().max(200).optional().or(z.literal(''))
  })
  .superRefine((value, ctx) => {
    const needsEntity =
      value.guarantorTypeId === GUARANTOR_TYPE_CUSTOMER ||
      value.guarantorTypeId === GUARANTOR_TYPE_STAFF ||
      value.guarantorTypeId === GUARANTOR_TYPE_GROUP;
    if (needsEntity && value.entityId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          value.guarantorTypeId === GUARANTOR_TYPE_CUSTOMER
            ? 'Search for and select a customer.'
            : value.guarantorTypeId === GUARANTOR_TYPE_STAFF
              ? 'Select a staff member.'
              : 'Select a group.',
        path: ['entityId']
      });
    }
    if (value.guarantorTypeId === GUARANTOR_TYPE_EXTERNAL) {
      if (!value.firstname?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First name is required for external guarantors.',
          path: ['firstname']
        });
      }
      if (!value.lastname?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last name is required for external guarantors.',
          path: ['lastname']
        });
      }
      if (!value.nationalIdNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'National ID Number is required for external guarantors.',
          path: ['nationalIdNumber']
        });
      }
    }
    const hasSavings = value.savingsId != null;
    const hasAmount = typeof value.amount === 'number' && Number.isFinite(value.amount);
    if (hasSavings && !hasAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter the amount to pledge.',
        path: ['amount']
      });
    }
    if (hasAmount && !hasSavings) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select the savings account to pledge.',
        path: ['savingsId']
      });
    }
  });

const updatePersonalFields = {
  clientRelationshipTypeId: optionalId,
  entityId: optionalId,
  firstname: optionalText(50),
  lastname: optionalText(50),
  nationalIdNumber: optionalText(50),
  addressLine1: optionalText(500),
  addressLine2: optionalText(500),
  city: optionalText(50),
  state: optionalText(50),
  country: optionalText(50),
  zip: optionalText(20),
  mobileNumber: optionalPhone,
  housePhoneNumber: optionalPhone,
  comment: optionalText(500),
  dob: optionalDate
} as const;

export const updateLoanGuarantorSchema = z
  .object(updatePersonalFields)
  .superRefine((value, ctx) => {
    const hasChange = [
      value.entityId,
      value.firstname,
      value.lastname,
      value.nationalIdNumber,
      value.addressLine1,
      value.addressLine2,
      value.city,
      value.state,
      value.country,
      value.zip,
      value.mobileNumber,
      value.housePhoneNumber,
      value.comment
    ].some((field) => (typeof field === 'string' ? field.trim() !== '' : field != null));
    if (!hasChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Change the relationship together with a name, national ID, address, phone, or comment.',
        path: ['clientRelationshipTypeId']
      });
    }
    if (value.firstname != null || value.lastname != null) {
      if (!value.firstname?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'First name is required for external guarantors.',
          path: ['firstname']
        });
      }
      if (!value.lastname?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last name is required for external guarantors.',
          path: ['lastname']
        });
      }
      if (!value.nationalIdNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'National ID Number is required for external guarantors.',
          path: ['nationalIdNumber']
        });
      }
    }
  });

export type LoanGuarantorItemInput = z.infer<typeof loanGuarantorItemSchema>;
export type UpdateLoanGuarantorInput = z.infer<typeof updateLoanGuarantorSchema>;
