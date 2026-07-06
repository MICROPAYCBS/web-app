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
const optionalNote = z.string().trim().max(1000).optional();

const optionalPaymentFields = {
  accountNumber: z.string().trim().max(100).optional(),
  checkNumber: z.string().trim().max(100).optional(),
  routingCode: z.string().trim().max(100).optional(),
  receiptNumber: z.string().trim().max(100).optional(),
  bankNumber: z.string().trim().max(100).optional()
};

export const loanAccountApproveCommandSchema = z.object({
  approvedOnDate: requiredDate,
  expectedDisbursementDate: optionalDate,
  approvedLoanAmount: z.coerce.number().positive('Approved amount must be greater than zero.'),
  note: optionalNote
});

export const loanAccountRejectCommandSchema = z.object({
  rejectedOnDate: requiredDate,
  note: optionalNote
});

export const loanAccountWithdrawnCommandSchema = z.object({
  withdrawnOnDate: requiredDate,
  note: optionalNote
});

export const loanAccountUndoApprovalCommandSchema = z.object({
  note: optionalNote
});

export const loanAccountUndoDisbursalCommandSchema = z.object({
  note: z.string().trim().min(1, 'Note is required.')
});

export const loanAccountDisburseCommandSchema = z.object({
  actualDisbursementDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentTypeId: z.coerce.number().int().positive('Select a payment type.').optional(),
  externalId: z.string().trim().max(100).optional(),
  note: optionalNote,
  ...optionalPaymentFields
});

export const loanAccountDisburseToSavingsCommandSchema = z.object({
  actualDisbursementDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  note: optionalNote
});

export const loanAccountWriteOffCommandSchema = z.object({
  transactionDate: requiredDate,
  writeoffReasonId: z.coerce.number().int().positive().optional(),
  note: optionalNote
});

export const loanAccountTransactionCommandSchema = z.object({
  transactionDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentTypeId: z.coerce.number().int().positive('Select a payment type.').optional(),
  externalId: z.string().trim().max(100).optional(),
  note: optionalNote,
  writeoffReasonId: z.coerce.number().int().positive().optional(),
  ...optionalPaymentFields
});

export type LoanAccountApproveCommandInput = z.infer<typeof loanAccountApproveCommandSchema>;
export type LoanAccountRejectCommandInput = z.infer<typeof loanAccountRejectCommandSchema>;
export type LoanAccountWithdrawnCommandInput = z.infer<typeof loanAccountWithdrawnCommandSchema>;
export type LoanAccountUndoApprovalCommandInput = z.infer<typeof loanAccountUndoApprovalCommandSchema>;
export type LoanAccountUndoDisbursalCommandInput = z.infer<typeof loanAccountUndoDisbursalCommandSchema>;
export type LoanAccountDisburseCommandInput = z.infer<typeof loanAccountDisburseCommandSchema>;
export type LoanAccountDisburseToSavingsCommandInput = z.infer<
  typeof loanAccountDisburseToSavingsCommandSchema
>;
export type LoanAccountWriteOffCommandInput = z.infer<typeof loanAccountWriteOffCommandSchema>;
export type LoanAccountTransactionCommandInput = z.infer<typeof loanAccountTransactionCommandSchema>;

export const loanAccountAssignOfficerSchema = z.object({
  toLoanOfficerId: z.coerce.number().int().positive('Select a loan officer.'),
  assignmentDate: requiredDate
});

export const loanAccountUnassignOfficerSchema = z.object({
  unassignedDate: requiredDate
});

export type LoanAccountAssignOfficerInput = z.infer<typeof loanAccountAssignOfficerSchema>;
export type LoanAccountUnassignOfficerInput = z.infer<typeof loanAccountUnassignOfficerSchema>;

export const loanAccountAddChargeSchema = z.object({
  chargeId: z.coerce.number().int().positive('Select a charge.'),
  amount: z.coerce.number().min(0, 'Amount is required.'),
  dueDate: z.string().trim().optional()
});

export type LoanAccountAddChargeInput = z.infer<typeof loanAccountAddChargeSchema>;
