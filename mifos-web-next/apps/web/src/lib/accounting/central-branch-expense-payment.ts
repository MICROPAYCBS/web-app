/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateJournalEntryFormInput } from '@mifos/validation';
import type {
  CentralBranchExpenseLineInput,
  CentralBranchExpensePaymentFormInput
} from '@mifos/validation';

export const CENTRAL_BRANCH_EXPENSE_PAYMENT_COMMENT_PREFIX = 'Cross-branch';
export const DEFAULT_CLEARING_GL_CODE = 'MP-20010'; // Fallback when interBranchRecon financial activity mapping is absent

export type CentralBranchExpensePaymentExpandInput = CentralBranchExpensePaymentFormInput & {
  clearingGlAccountId: number;
  officeNamesById?: Record<number, string>;
};

export type ExpandedCentralBranchExpenseEntry = {
  role: 'branch_expense' | 'ho_funding';
  step: number;
  officeId: number;
  officeName: string;
  branchOfficeId?: number;
  input: CreateJournalEntryFormInput;
};

export type CentralBranchExpenseReviewLine = {
  side: 'debit' | 'credit';
  glAccountId: number;
  amount: number;
  label?: string;
};

export type CentralBranchExpenseReviewSection = {
  title: string;
  officeName: string;
  lines: CentralBranchExpenseReviewLine[];
};

export function generateCentralBranchExpensePaymentReference(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const shortId = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XB-${yyyy}${mm}${dd}-${shortId}`;
}

export function formatCentralBranchExpensePaymentComments(userComments?: string): string {
  const trimmed = userComments?.trim();
  return trimmed
    ? `${CENTRAL_BRANCH_EXPENSE_PAYMENT_COMMENT_PREFIX} | ${trimmed}`
    : CENTRAL_BRANCH_EXPENSE_PAYMENT_COMMENT_PREFIX;
}

export function mergeCentralBranchExpenseLines(
  lines: CentralBranchExpenseLineInput[]
): CentralBranchExpenseLineInput[] {
  const merged = new Map<string, CentralBranchExpenseLineInput>();
  for (const line of lines) {
    const key = `${line.branchOfficeId}:${line.expenseGlAccountId}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...line });
      continue;
    }
    merged.set(key, {
      ...existing,
      amount: existing.amount + line.amount,
      departmentId: existing.departmentId ?? line.departmentId
    });
  }
  return [...merged.values()];
}

export function expandCentralBranchExpensePayment(
  input: CentralBranchExpensePaymentExpandInput
): ExpandedCentralBranchExpenseEntry[] {
  const expenseLines = mergeCentralBranchExpenseLines(input.expenseLines);
  const baseComments = formatCentralBranchExpensePaymentComments(input.comments);
  const officeName = (officeId: number) =>
    input.officeNamesById?.[officeId] ?? `Office ${officeId}`;

  const entries: ExpandedCentralBranchExpenseEntry[] = [];
  let step = 1;

  for (const line of expenseLines) {
    const clearingGlAccountId = input.clearingGlAccountId;
    const branchName = officeName(line.branchOfficeId);
    entries.push({
      role: 'branch_expense',
      step: step++,
      officeId: line.branchOfficeId,
      officeName: branchName,
      branchOfficeId: line.branchOfficeId,
      input: {
        officeId: line.branchOfficeId,
        departmentId: line.departmentId,
        currencyCode: input.currencyCode,
        transactionDate: input.transactionDate,
        referenceNumber: input.referenceNumber,
        comments: `${baseComments} | Branch: ${branchName}`,
        debits: [{ glAccountId: line.expenseGlAccountId, amount: line.amount }],
        credits: [{ glAccountId: clearingGlAccountId, amount: line.amount }]
      }
    });
  }

  const totalAmount = expenseLines.reduce((sum, line) => sum + line.amount, 0);
  const fundingName = officeName(input.fundingOfficeId);

  entries.push({
    role: 'ho_funding',
    step: step++,
    officeId: input.fundingOfficeId,
    officeName: fundingName,
    input: {
      officeId: input.fundingOfficeId,
      currencyCode: input.currencyCode,
      transactionDate: input.transactionDate,
      referenceNumber: input.referenceNumber,
      comments: `${baseComments} | Source`,
      debits: expenseLines.map((line) => ({
        glAccountId: input.clearingGlAccountId,
        amount: line.amount
      })),
      credits: [{ glAccountId: input.bankGlAccountId, amount: totalAmount }],
      paymentTypeId: input.paymentTypeId,
      accountNumber: input.accountNumber,
      checkNumber: input.checkNumber,
      routingCode: input.routingCode,
      receiptNumber: input.receiptNumber,
      bankNumber: input.bankNumber
    }
  });

  return entries;
}

export function centralBranchExpensePaymentTotal(expenseLines: CentralBranchExpenseLineInput[]): number {
  return expenseLines.reduce((sum, line) => sum + line.amount, 0);
}

export function buildCentralBranchExpensePaymentReview(
  input: CentralBranchExpensePaymentExpandInput,
  glAccountLabels: Record<number, string>
): {
  funding: CentralBranchExpenseReviewSection;
  branches: CentralBranchExpenseReviewSection[];
  journalEntryCount: number;
  totalAmount: number;
} {
  const officeName = (officeId: number) =>
    input.officeNamesById?.[officeId] ?? `Office ${officeId}`;
  const expanded = expandCentralBranchExpensePayment(input);
  const label = (glAccountId: number, suffix?: string) => {
    const account = glAccountLabels[glAccountId] ?? `GL ${glAccountId}`;
    return suffix ? `${account} (${suffix})` : account;
  };

  const ho = expanded.find((entry) => entry.role === 'ho_funding');
  const branches = expanded.filter((entry) => entry.role === 'branch_expense');
  const expenseLines = mergeCentralBranchExpenseLines(input.expenseLines);

  const funding: CentralBranchExpenseReviewSection = {
    title: 'Source office',
    officeName: ho?.officeName ?? officeName(input.fundingOfficeId),
    lines: [
      ...expenseLines.map((line) => ({
        side: 'debit' as const,
        glAccountId: input.clearingGlAccountId,
        amount: line.amount,
        label: label(input.clearingGlAccountId, officeName(line.branchOfficeId))
      })),
      {
        side: 'credit',
        glAccountId: input.bankGlAccountId,
        amount: centralBranchExpensePaymentTotal(expenseLines),
        label: label(input.bankGlAccountId)
      }
    ]
  };

  return {
    funding,
    branches: branches.map((entry) => {
      const line = expenseLines.find((row) => row.branchOfficeId === entry.branchOfficeId);
      const clearingGlAccountId = input.clearingGlAccountId;
      const expenseGlAccountId = line?.expenseGlAccountId ?? 0;
      const amount = line?.amount ?? 0;
      return {
        title: 'Branches',
        officeName: entry.officeName,
        lines: [
          {
            side: 'debit' as const,
            glAccountId: expenseGlAccountId,
            amount,
            label: label(expenseGlAccountId)
          },
          {
            side: 'credit' as const,
            glAccountId: clearingGlAccountId,
            amount,
            label: label(clearingGlAccountId)
          }
        ]
      };
    }),
    journalEntryCount: expanded.length,
    totalAmount: centralBranchExpensePaymentTotal(expenseLines)
  };
}

export function findDefaultClearingGlAccountId(
  glAccounts: { id: number; glCode: string }[],
  preferredCode = DEFAULT_CLEARING_GL_CODE
): number | null {
  const match = glAccounts.find(
    (account) => account.glCode.trim().toUpperCase() === preferredCode.toUpperCase()
  );
  return match?.id ?? null;
}
