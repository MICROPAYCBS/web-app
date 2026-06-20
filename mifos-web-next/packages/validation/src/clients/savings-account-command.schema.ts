/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const optionalNote = z.string().trim().max(1000).optional();

const optionalPaymentFields = {
  accountNumber: z.string().trim().max(100).optional(),
  checkNumber: z.string().trim().max(100).optional(),
  routingCode: z.string().trim().max(100).optional(),
  receiptNumber: z.string().trim().max(100).optional(),
  bankNumber: z.string().trim().max(100).optional()
};

export const savingsAccountApproveCommandSchema = z.object({
  approvedOnDate: requiredDate,
  note: optionalNote
});

export const savingsAccountActivateCommandSchema = z.object({
  activatedOnDate: requiredDate
});

export const savingsAccountRejectCommandSchema = z.object({
  rejectedOnDate: requiredDate,
  note: optionalNote
});

export const savingsAccountWithdrawnByApplicantCommandSchema = z.object({
  withdrawnOnDate: requiredDate,
  note: optionalNote
});

export const savingsAccountUndoApprovalCommandSchema = z.object({
  note: optionalNote
});

export const savingsAccountCloseCommandSchema = z
  .object({
    closedOnDate: requiredDate,
    note: optionalNote,
    withdrawBalance: z.boolean().optional(),
    paymentTypeId: z.coerce.number().int().positive().optional(),
    ...optionalPaymentFields
  })
  .superRefine((data, ctx) => {
    if (data.withdrawBalance && !data.paymentTypeId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Payment type is required when withdrawing the balance.',
        path: ['paymentTypeId']
      });
    }
  });

export const savingsAccountBlockCommandSchema = z.object({
  reasonForBlock: z.string().trim().min(1, 'Reason is required.')
});

export const savingsAccountTransactionCommandSchema = z.object({
  transactionDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentTypeId: z.coerce.number().int().positive('Select a payment type.'),
  ...optionalPaymentFields,
  note: optionalNote
});

export type SavingsAccountApproveCommandInput = z.infer<typeof savingsAccountApproveCommandSchema>;
export type SavingsAccountActivateCommandInput = z.infer<typeof savingsAccountActivateCommandSchema>;
export type SavingsAccountRejectCommandInput = z.infer<typeof savingsAccountRejectCommandSchema>;
export type SavingsAccountWithdrawnByApplicantCommandInput = z.infer<
  typeof savingsAccountWithdrawnByApplicantCommandSchema
>;
export type SavingsAccountUndoApprovalCommandInput = z.infer<
  typeof savingsAccountUndoApprovalCommandSchema
>;
export type SavingsAccountCloseCommandInput = z.infer<typeof savingsAccountCloseCommandSchema>;
export type SavingsAccountBlockCommandInput = z.infer<typeof savingsAccountBlockCommandSchema>;
export type SavingsAccountTransactionCommandInput = z.infer<
  typeof savingsAccountTransactionCommandSchema
>;
