/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { legalTenderLineInputSchema } from '../organization/legal-tender-lines.schema';

const requiredDate = z.string().trim().min(1, 'Date is required.');
const optionalNote = z.string().trim().max(1000).optional();

const optionalPaymentFields = {
  accountNumber: z.string().trim().max(100).optional(),
  checkNumber: z.string().trim().max(100).optional(),
  routingCode: z.string().trim().max(100).optional(),
  receiptNumber: z.string().trim().max(100).optional(),
  bankNumber: z.string().trim().max(100).optional()
};

/** Closure option id for transfer to a linked savings account (Fineract DepositAccountOnClosureType.TRANSFER_TO_SAVINGS). */
export const DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID = 200;

export const depositAccountApproveCommandSchema = z.object({
  approvedOnDate: requiredDate,
  note: optionalNote
});

export const depositAccountActivateCommandSchema = z.object({
  activatedOnDate: requiredDate
});

export const depositAccountRejectCommandSchema = z.object({
  rejectedOnDate: requiredDate,
  note: optionalNote
});

export const depositAccountWithdrawnByApplicantCommandSchema = z.object({
  withdrawnOnDate: requiredDate,
  note: optionalNote
});

export const depositAccountUndoApprovalCommandSchema = z.object({
  note: optionalNote
});

export const depositAccountUndoActivationCommandSchema = z.object({
  note: optionalNote
});

export const depositAccountCalculatePrematureAmountSchema = z.object({
  closedOnDate: requiredDate
});

export const depositAccountPrematureCloseCommandSchema = z
  .object({
    closedOnDate: requiredDate,
    note: optionalNote,
    onAccountClosureId: z.coerce.number().int().positive().optional(),
    toSavingsAccountId: z.coerce.number().int().positive().optional(),
    transferDescription: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (
      data.onAccountClosureId === DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID &&
      !data.toSavingsAccountId
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a savings account to receive the transfer.',
        path: ['toSavingsAccountId']
      });
    }
  });

export const depositAccountCloseCommandSchema = z
  .object({
    closedOnDate: requiredDate,
    note: optionalNote,
    onAccountClosureId: z.coerce.number().int().positive('Select how to close the account.'),
    toSavingsAccountId: z.coerce.number().int().positive().optional(),
    transferDescription: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (
      data.onAccountClosureId === DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID &&
      !data.toSavingsAccountId
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a savings account to receive the transfer.',
        path: ['toSavingsAccountId']
      });
    }
  });

export const depositAccountTransactionCommandSchema = z.object({
  transactionDate: requiredDate,
  transactionAmount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentTypeId: z.coerce.number().int().positive('Select a payment type.'),
  entryMode: z.enum(['amount', 'denominations']).optional(),
  legalTenderLines: z.array(legalTenderLineInputSchema).optional(),
  ...optionalPaymentFields,
  note: optionalNote
});

export type DepositAccountApproveCommandInput = z.infer<typeof depositAccountApproveCommandSchema>;
export type DepositAccountActivateCommandInput = z.infer<typeof depositAccountActivateCommandSchema>;
export type DepositAccountRejectCommandInput = z.infer<typeof depositAccountRejectCommandSchema>;
export type DepositAccountWithdrawnByApplicantCommandInput = z.infer<
  typeof depositAccountWithdrawnByApplicantCommandSchema
>;
export type DepositAccountUndoApprovalCommandInput = z.infer<
  typeof depositAccountUndoApprovalCommandSchema
>;
export type DepositAccountUndoActivationCommandInput = z.infer<
  typeof depositAccountUndoActivationCommandSchema
>;
export type DepositAccountCalculatePrematureAmountInput = z.infer<
  typeof depositAccountCalculatePrematureAmountSchema
>;
export type DepositAccountPrematureCloseCommandInput = z.infer<
  typeof depositAccountPrematureCloseCommandSchema
>;
export type DepositAccountCloseCommandInput = z.infer<typeof depositAccountCloseCommandSchema>;
export type DepositAccountTransactionCommandInput = z.infer<
  typeof depositAccountTransactionCommandSchema
>;
