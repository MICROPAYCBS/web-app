/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  createJournalEntryFormBaseSchema,
  refineJournalEntryBalance,
  type CreateJournalEntryFormInput
} from './journal-entry.schema';

export const createFrequentPostingFormSchema = createJournalEntryFormBaseSchema
  .omit({ externalAssetOwner: true })
  .extend({
    accountingRule: z.number().int().positive('Accounting rule is required.')
  })
  .superRefine(refineJournalEntryBalance);

export type CreateFrequentPostingFormInput = z.infer<typeof createFrequentPostingFormSchema>;

export function validateCreateFrequentPostingForm(input: unknown) {
  return createFrequentPostingFormSchema.safeParse(input);
}

export function buildCreateFrequentPostingPayload(
  input: CreateFrequentPostingFormInput,
  options: { locale: string; dateFormat: string }
) {
  return {
    locale: options.locale,
    dateFormat: options.dateFormat,
    officeId: input.officeId,
    accountingRule: input.accountingRule,
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
    comments: input.comments?.trim() || undefined
  };
}
