/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value === '' || value === undefined ? undefined : value));

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().optional()
);

const optionalPositiveDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().positive().optional()
);

export const LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE =
  'Choose at least one change: a new installment date, grace periods, extra repayments, or a new interest rate.';

export const createLoanRescheduleRequestSchema = z
  .object({
    loanId: z.coerce.number().int().positive(),
    rescheduleFromDate: requiredDate,
    rescheduleReasonId: z.coerce.number().int().positive('Select a reason.'),
    submittedOnDate: requiredDate,
    rescheduleReasonComment: z
      .string()
      .trim()
      .max(500, 'Comments must be 500 characters or fewer.')
      .optional()
      .or(z.literal('')),
    adjustedDueDate: optionalDate,
    graceOnPrincipal: optionalPositiveInt,
    graceOnInterest: optionalPositiveInt,
    extraTerms: optionalPositiveInt,
    newInterestRate: optionalPositiveDecimal
  })
  .superRefine((data, ctx) => {
    const hasChange =
      Boolean(data.adjustedDueDate?.trim()) ||
      data.graceOnPrincipal != null ||
      data.graceOnInterest != null ||
      data.extraTerms != null ||
      data.newInterestRate != null;
    if (!hasChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE,
        path: ['adjustedDueDate']
      });
    }
  });

export const approveLoanRescheduleRequestSchema = z.object({
  approvedOnDate: requiredDate
});

export const rejectLoanRescheduleRequestSchema = z.object({
  rejectedOnDate: requiredDate
});

export type CreateLoanRescheduleRequestInput = z.infer<typeof createLoanRescheduleRequestSchema>;
export type ApproveLoanRescheduleRequestInput = z.infer<typeof approveLoanRescheduleRequestSchema>;
export type RejectLoanRescheduleRequestInput = z.infer<typeof rejectLoanRescheduleRequestSchema>;
