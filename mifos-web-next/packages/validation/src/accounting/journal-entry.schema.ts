/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  areJournalEntryTotalsBalanced,
  JOURNAL_ENTRY_UNBALANCED_MESSAGE
} from '@mifos/domain';

export const journalEntryLineSchema = z.object({
  glAccountId: z.number().int().positive('Select a GL account.'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1.')
});

export const createJournalEntryFormBaseSchema = z.object({
  officeId: z.number().int().positive('Branch is required.'),
  currencyCode: z.string().trim().min(1, 'Currency is required.'),
  transactionDate: z.string().trim().min(1, 'Transaction date is required.'),
  debits: z.array(journalEntryLineSchema).min(1, 'Add at least one debit line.'),
  credits: z.array(journalEntryLineSchema).min(1, 'Add at least one credit line.'),
  referenceNumber: z.string().optional(),
  paymentTypeId: z.number().int().positive().optional(),
  accountNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  routingCode: z.string().optional(),
  receiptNumber: z.string().optional(),
  bankNumber: z.string().optional(),
  comments: z.string().optional(),
  externalAssetOwner: z.string().optional()
});

function refineJournalEntryBalance(
  data: Pick<z.infer<typeof createJournalEntryFormBaseSchema>, 'debits' | 'credits'>,
  ctx: z.RefinementCtx
) {
  if (!areJournalEntryTotalsBalanced(data.debits, data.credits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: JOURNAL_ENTRY_UNBALANCED_MESSAGE,
      path: ['balance']
    });
  }
}

export { refineJournalEntryBalance };

export const createJournalEntryFormSchema = createJournalEntryFormBaseSchema.superRefine(
  refineJournalEntryBalance
);

export const revertJournalEntrySchema = z.object({
  comments: z.string().optional()
});

export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type CreateJournalEntryFormInput = z.infer<typeof createJournalEntryFormSchema>;
export type RevertJournalEntryInput = z.infer<typeof revertJournalEntrySchema>;

export function validateCreateJournalEntryForm(input: unknown) {
  return createJournalEntryFormSchema.safeParse(input);
}

export function validateRevertJournalEntry(input: unknown) {
  return revertJournalEntrySchema.safeParse(input);
}

export function buildCreateJournalEntryPayload(
  input: CreateJournalEntryFormInput,
  options: { locale: string; dateFormat: string }
) {
  return {
    locale: options.locale,
    dateFormat: options.dateFormat,
    officeId: input.officeId,
    currencyCode: input.currencyCode,
    transactionDate: input.transactionDate,
    debits: input.debits.map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount
    })),
    credits: input.credits.map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount
    })),
    referenceNumber: input.referenceNumber?.trim() || undefined,
    paymentTypeId: input.paymentTypeId,
    accountNumber: input.accountNumber?.trim() || undefined,
    checkNumber: input.checkNumber?.trim() || undefined,
    routingCode: input.routingCode?.trim() || undefined,
    receiptNumber: input.receiptNumber?.trim() || undefined,
    bankNumber: input.bankNumber?.trim() || undefined,
    comments: input.comments?.trim() || undefined,
    externalAssetOwner: input.externalAssetOwner?.trim() || undefined
  };
}
