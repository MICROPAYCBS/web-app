/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractClientAccounts,
  FineractClientGuarantorAccount,
  FineractClientLoanAccount,
  FineractClientSavingsAccount,
  FineractClientShareAccount
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function getClientAccounts(clientId: string | number): Promise<FineractClientAccounts> {
  const fineract = await createFineractClient();
  return fineract.get<FineractClientAccounts>(`/clients/${clientId}/accounts`);
}

const CLOSED_LOAN_CODES = new Set([
  'loanStatusType.closed.written.off',
  'loanStatusType.closed.obligations.met',
  'loanStatusType.closed.reschedule.outstanding.amount',
  'loanStatusType.withdrawn.by.client',
  'loanStatusType.rejected'
]);

const CLOSED_SAVINGS_CODES = new Set([
  'savingsAccountStatusType.withdrawn.by.applicant',
  'savingsAccountStatusType.closed',
  'savingsAccountStatusType.pre.mature.closure',
  'savingsAccountStatusType.rejected'
]);

export function mergeClientLoanAccounts(accounts: FineractClientAccounts): FineractClientLoanAccount[] {
  const loans = [...(accounts.loanAccounts ?? [])];
  for (const account of accounts.workingCapitalLoanAccounts ?? []) {
    loans.push({ ...account, productType: account.productType ?? 'working-capital' });
  }
  return loans;
}

export function normalizeGuarantorAccounts(value: unknown): FineractClientGuarantorAccount[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const accounts: FineractClientGuarantorAccount[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'number' ? row.id : Number(row.id);
    const accountNo = typeof row.accountNo === 'string' ? row.accountNo : '';
    const status =
      row.status && typeof row.status === 'object'
        ? (row.status as FineractClientGuarantorAccount['status'])
        : {};
    if (!Number.isFinite(id) || !accountNo) {
      continue;
    }
    const onHold = typeof row.onHoldAmount === 'number' ? row.onHoldAmount : Number(row.onHoldAmount);
    const balance = typeof row.loanBalance === 'number' ? row.loanBalance : Number(row.loanBalance);
    accounts.push({
      id,
      accountNo,
      productName: typeof row.productName === 'string' ? row.productName : undefined,
      status,
      inArrears: row.inArrears === true,
      loanBalance: Number.isFinite(balance) ? balance : undefined,
      isActive: row.isActive === true,
      relationship: typeof row.relationship === 'string' ? row.relationship : undefined,
      onHoldAmount: Number.isFinite(onHold) ? onHold : undefined
    });
  }
  return accounts;
}

/** Borrower client id for each guaranteed loan, so the row can open that loan. */
export async function loadGuarantorLoanBorrowerIds(
  loanIds: number[]
): Promise<Map<number, number>> {
  const fineract = await createFineractClient();
  const entries = await Promise.all(
    loanIds.map(async (loanId) => {
      try {
        const raw = await fineract.get<unknown>(`/loans/${loanId}`);
        if (!raw || typeof raw !== 'object') {
          return null;
        }
        const clientId = (raw as { clientId?: unknown }).clientId;
        const id = typeof clientId === 'number' ? clientId : Number(clientId);
        if (!Number.isFinite(id) || id <= 0) {
          return null;
        }
        return [loanId, id] as const;
      } catch {
        return null;
      }
    })
  );
  return new Map(entries.filter((entry): entry is readonly [number, number] => entry != null));
}

export function filterOpenLoanAccounts(accounts: FineractClientLoanAccount[]): FineractClientLoanAccount[] {
  return accounts.filter((account) => !isClosedLoanAccount(account.status?.code));
}

export function filterClosedLoanAccounts(accounts: FineractClientLoanAccount[]): FineractClientLoanAccount[] {
  return accounts.filter((account) => isClosedLoanAccount(account.status?.code));
}

export function isClosedLoanAccount(statusCode?: string): boolean {
  return CLOSED_LOAN_CODES.has(statusCode ?? '');
}

export function isClosedSavingsAccount(statusCode?: string): boolean {
  return CLOSED_SAVINGS_CODES.has(statusCode ?? '');
}

export function filterSavingsByDepositType(
  accounts: FineractClientSavingsAccount[],
  depositTypeValue: 'Savings' | 'Fixed Deposit' | 'Recurring Deposit'
): FineractClientSavingsAccount[] {
  return accounts.filter((account) => account.depositType?.value === depositTypeValue);
}

export function filterOpenSavingsAccounts(
  accounts: FineractClientSavingsAccount[]
): FineractClientSavingsAccount[] {
  return accounts.filter((account) => !isClosedSavingsAccount(account.status?.code));
}

export function filterClosedSavingsAccounts(
  accounts: FineractClientSavingsAccount[]
): FineractClientSavingsAccount[] {
  return accounts.filter((account) => isClosedSavingsAccount(account.status?.code));
}

const CLOSED_SHARE_CODES = new Set([
  'shareAccountStatusType.closed',
  'shareAccountStatusType.rejected'
]);

export function filterOpenShareAccounts(
  accounts: FineractClientShareAccount[]
): FineractClientShareAccount[] {
  return accounts.filter((account) => !CLOSED_SHARE_CODES.has(account.status?.code ?? ''));
}

export function filterClosedShareAccounts(
  accounts: FineractClientShareAccount[]
): FineractClientShareAccount[] {
  return accounts.filter((account) => CLOSED_SHARE_CODES.has(account.status?.code ?? ''));
}
