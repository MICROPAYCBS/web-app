/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateJournalEntryFormInput } from './journal-entry.schema';

export const INTER_BRANCH_JOURNAL_ENTRY_COMMENT_PREFIX = 'Cross-branch';

export type ExpandedInterBranchJournalEntry = {
  role: 'debit_office' | 'credit_office';
  step: number;
  officeId: number;
  officeName: string;
  input: CreateJournalEntryFormInput;
};

export type InterBranchJournalEntryExpandInput = CreateJournalEntryFormInput & {
  clearingGlAccountId: number;
  officeNamesById?: Record<number, string>;
};

export function isInterBranchJournalEntry(
  input: Pick<CreateJournalEntryFormInput, 'debitOfficeId' | 'creditOfficeId'>
) {
  return input.debitOfficeId !== input.creditOfficeId;
}

export function journalEntryLinesTotal(
  lines: CreateJournalEntryFormInput['debits']
): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function formatInterBranchJournalEntryComments(userComments?: string): string {
  const trimmed = userComments?.trim();
  return trimmed
    ? `${INTER_BRANCH_JOURNAL_ENTRY_COMMENT_PREFIX} | ${trimmed}`
    : INTER_BRANCH_JOURNAL_ENTRY_COMMENT_PREFIX;
}

export function expandInterBranchJournalEntry(
  input: InterBranchJournalEntryExpandInput
): ExpandedInterBranchJournalEntry[] {
  const officeName = (officeId: number) =>
    input.officeNamesById?.[officeId] ?? `Office ${officeId}`;
  const baseComments = formatInterBranchJournalEntryComments(input.comments);
  const totalAmount = journalEntryLinesTotal(input.debits);

  const sharedFields = {
    currencyCode: input.currencyCode,
    transactionDate: input.transactionDate,
    referenceNumber: input.referenceNumber
  };

  const debitOfficeName = officeName(input.debitOfficeId);
  const creditOfficeName = officeName(input.creditOfficeId);

  return [
    {
      role: 'debit_office',
      step: 1,
      officeId: input.debitOfficeId,
      officeName: debitOfficeName,
      input: {
        ...sharedFields,
        debitOfficeId: input.debitOfficeId,
        creditOfficeId: input.debitOfficeId,
        debitDepartmentId: input.debitDepartmentId,
        debits: input.debits,
        credits: [{ glAccountId: input.clearingGlAccountId, amount: totalAmount }],
        comments: `${baseComments} | Debit office: ${debitOfficeName}`
      }
    },
    {
      role: 'credit_office',
      step: 2,
      officeId: input.creditOfficeId,
      officeName: creditOfficeName,
      input: {
        ...sharedFields,
        debitOfficeId: input.creditOfficeId,
        creditOfficeId: input.creditOfficeId,
        creditDepartmentId: input.creditDepartmentId,
        debits: [{ glAccountId: input.clearingGlAccountId, amount: totalAmount }],
        credits: input.credits,
        comments: `${baseComments} | Credit office: ${creditOfficeName}`,
        paymentTypeId: input.paymentTypeId,
        accountNumber: input.accountNumber,
        checkNumber: input.checkNumber,
        routingCode: input.routingCode,
        receiptNumber: input.receiptNumber,
        bankNumber: input.bankNumber
      }
    }
  ];
}
