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

const optionalPositiveDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().positive().optional()
) as z.ZodType<number | undefined>;

export const LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE =
  'Change at least one installment date or amount, or add or remove an installment.';

export const loanVariableInstallmentAmountKindSchema = z.enum([
  'installmentAmount',
  'principal'
]);

const modifiedInstallmentSchema = z
  .object({
    dueDate: requiredDate,
    modifiedDueDate: optionalDate,
    principal: optionalPositiveDecimal,
    installmentAmount: optionalPositiveDecimal
  })
  .superRefine((data, ctx) => {
    if (!data.modifiedDueDate && data.principal == null && data.installmentAmount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Change the due date or amount for this installment.',
        path: ['modifiedDueDate']
      });
    }
  });

const newInstallmentSchema = z
  .object({
    dueDate: requiredDate,
    principal: optionalPositiveDecimal,
    installmentAmount: optionalPositiveDecimal
  })
  .superRefine((data, ctx) => {
    if (data.principal == null && data.installmentAmount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter an amount for the new installment.',
        path: ['installmentAmount']
      });
    }
  });

const deletedInstallmentSchema = z.object({
  dueDate: requiredDate
});

export const loanVariableScheduleExceptionsSchema = z
  .object({
    loanId: z.coerce.number().int().positive(),
    amountKind: loanVariableInstallmentAmountKindSchema,
    modifiedinstallments: z.array(modifiedInstallmentSchema).optional(),
    newinstallments: z.array(newInstallmentSchema).optional(),
    deletedinstallments: z.array(deletedInstallmentSchema).optional()
  })
  .superRefine((data, ctx) => {
    const hasChange =
      (data.modifiedinstallments?.length ?? 0) > 0 ||
      (data.newinstallments?.length ?? 0) > 0 ||
      (data.deletedinstallments?.length ?? 0) > 0;
    if (!hasChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE,
        path: ['modifiedinstallments']
      });
    }

    const wrongAmountPath =
      data.amountKind === 'installmentAmount' ? 'principal' : 'installmentAmount';
    const wrongAmountMessage =
      data.amountKind === 'installmentAmount'
        ? 'Use installment amount for this loan, not principal.'
        : 'Use principal for this loan, not installment amount.';

    for (const [index, row] of (data.modifiedinstallments ?? []).entries()) {
      if (row[wrongAmountPath] != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: wrongAmountMessage,
          path: ['modifiedinstallments', index, wrongAmountPath]
        });
      }
    }
    for (const [index, row] of (data.newinstallments ?? []).entries()) {
      if (row[wrongAmountPath] != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: wrongAmountMessage,
          path: ['newinstallments', index, wrongAmountPath]
        });
      }
    }
  });

export type LoanVariableInstallmentAmountKind = z.infer<
  typeof loanVariableInstallmentAmountKindSchema
>;
export type LoanVariableScheduleExceptionsInput = z.infer<
  typeof loanVariableScheduleExceptionsSchema
>;
