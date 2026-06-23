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

export const savingsAccountPostInterestAsOnSchema = z.object({
  transactionDate: requiredDate
});

export const savingsAccountHoldAmountSchema = z.object({
  reasonForBlock: z.coerce.number().int().positive('Select a reason.'),
  transactionDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.')
});

export const savingsAccountAssignStaffSchema = z.object({
  toSavingsOfficerId: z.coerce.number().int().positive('Select a field officer.'),
  assignmentDate: requiredDate
});

export const savingsAccountUnassignStaffSchema = z.object({
  unassignedDate: requiredDate
});

export const savingsAccountAddChargeSchema = z.object({
  chargeId: z.coerce.number().int().positive('Select a charge.'),
  amount: z.coerce.number().min(0, 'Amount is required.'),
  dueDate: z.string().trim().optional(),
  feeOnMonthDay: z.string().trim().optional(),
  feeInterval: z.coerce.number().int().positive().optional()
});

export const savingsAccountPayChargeSchema = z.object({
  chargeId: z.coerce.number().int().positive(),
  dueDate: requiredDate,
  amount: z.coerce.number().min(0).optional()
});

export const savingsAccountWithholdTaxSchema = z.object({
  withHoldTax: z.boolean()
});

export const savingsAccountUndoTransactionSchema = z.object({
  clientId: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  transactionId: z.coerce.number().int().positive(),
  transactionDate: requiredDate
});

export const savingsAccountModifyTransactionSchema = z.object({
  clientId: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  transactionId: z.coerce.number().int().positive(),
  transactionDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentTypeId: z.coerce.number().int().positive('Select a payment type.'),
  ...optionalPaymentFields,
  note: optionalNote
});

export const undoAccountTransferCommandSchema = z.object({
  clientId: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  transferId: z.coerce.number().int().positive()
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
export type SavingsAccountPostInterestAsOnInput = z.infer<
  typeof savingsAccountPostInterestAsOnSchema
>;
export type SavingsAccountHoldAmountInput = z.infer<typeof savingsAccountHoldAmountSchema>;
export type SavingsAccountAssignStaffInput = z.infer<typeof savingsAccountAssignStaffSchema>;
export type SavingsAccountUnassignStaffInput = z.infer<typeof savingsAccountUnassignStaffSchema>;
export type SavingsAccountAddChargeInput = z.infer<typeof savingsAccountAddChargeSchema>;
export type SavingsAccountPayChargeInput = z.infer<typeof savingsAccountPayChargeSchema>;
export type SavingsAccountWithholdTaxInput = z.infer<typeof savingsAccountWithholdTaxSchema>;
export type SavingsAccountUndoTransactionInput = z.infer<typeof savingsAccountUndoTransactionSchema>;
export type SavingsAccountModifyTransactionInput = z.infer<typeof savingsAccountModifyTransactionSchema>;
export type UndoAccountTransferCommandInput = z.infer<typeof undoAccountTransferCommandSchema>;
