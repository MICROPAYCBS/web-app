/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  },
  z.number().int().positive().optional()
);

export const centralBranchExpenseLineSchema = z.object({
  branchOfficeId: z.number().int().positive('Branch is required.'),
  expenseGlAccountId: z.number().int().positive('Debit account is required.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  departmentId: optionalPositiveInt
});

export const centralBranchExpensePaymentFormSchema = z.object({
  fundingOfficeId: z.number().int().positive('Source office is required.'),
  bankGlAccountId: z.number().int().positive('Credit account is required.'),
  currencyCode: z.string().trim().min(1, 'Currency is required.'),
  transactionDate: z.string().trim().min(1, 'Transaction date is required.'),
  referenceNumber: z.string().trim().min(1, 'Reference number is required.'),
  comments: z.string().optional(),
  expenseLines: z
    .array(centralBranchExpenseLineSchema)
    .min(1, 'Add at least one line.'),
  paymentTypeId: optionalPositiveInt,
  accountNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  routingCode: z.string().optional(),
  receiptNumber: z.string().optional(),
  bankNumber: z.string().optional()
});

export type CentralBranchExpenseLineInput = z.infer<typeof centralBranchExpenseLineSchema>;
export type CentralBranchExpensePaymentFormInput = z.infer<
  typeof centralBranchExpensePaymentFormSchema
>;

export type CentralBranchExpensePaymentValidationContext = {
  requireDepartmentOnExpenseLines?: boolean;
};

export function validateCentralBranchExpensePaymentForm(
  input: unknown,
  validationContext: CentralBranchExpensePaymentValidationContext = {}
) {
  return centralBranchExpensePaymentFormSchema
    .superRefine((data, ctx) => {
      const fundingOfficeId = data.fundingOfficeId;
      for (const [index, line] of data.expenseLines.entries()) {
        if (line.branchOfficeId === fundingOfficeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debit branch must differ from the source office. Use the standard journal entry wizard for same-office postings.',
            path: ['expenseLines', index, 'branchOfficeId']
          });
        }
        if (
          validationContext.requireDepartmentOnExpenseLines &&
          line.departmentId == null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Department is required on branch debit lines.',
            path: ['expenseLines', index, 'departmentId']
          });
        }
      }

      const branchKeys = new Set<string>();
      for (const [index, line] of data.expenseLines.entries()) {
        const key = `${line.branchOfficeId}:${line.expenseGlAccountId}`;
        if (branchKeys.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate branch and debit account combination.',
            path: ['expenseLines', index]
          });
        }
        branchKeys.add(key);
      }
    })
    .safeParse(input);
}
