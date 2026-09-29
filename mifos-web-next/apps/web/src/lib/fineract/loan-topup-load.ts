import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { getClientAccounts } from '@/lib/fineract/client-accounts';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  parseFineractDateString
} from '@/lib/fineract/dates';
import { normalizeLoanAccountDetail } from '@/lib/fineract/loan-account-normalize';
import {
  lastTopupUserTransactionDate,
  loanIsActiveStatus,
  loanIsPendingApprovalStatus,
  type LoanTopupContext,
  type LoanTopupPayoff,
  type PendingTopupClosure
} from '@/lib/fineract/loan-topup';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizePayoff(raw: unknown): LoanTopupPayoff | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const amount = toNumber(row.amount);
  if (amount == null) {
    return null;
  }
  return {
    amount,
    principalPortion: toNumber(row.principalPortion),
    interestPortion: toNumber(row.interestPortion),
    feeChargesPortion: toNumber(row.feeChargesPortion),
    penaltyChargesPortion: toNumber(row.penaltyChargesPortion)
  };
}

export async function loadLoanTopupContext(
  loanId: number,
  transactionDate: string
): Promise<{ ok: true; context: LoanTopupContext } | { ok: false; message: string }> {
  try {
    const fineract = await createFineractClient();
    const raw = await fineract.get<unknown>(`/loans/${loanId}`, {
      associations: 'transactions'
    });
    const account = normalizeLoanAccountDetail(raw);
    if (!account) {
      return { ok: false, message: 'Choose an active loan of this client' };
    }

    const actualDisbursementDate = fineractApiDateToFormString(
      account.timeline?.actualDisbursementDate
    );
    const transactions = (account.transactions ?? []).map((transaction) => ({
      reversed: transaction.reversed === true || transaction.manuallyReversed === true,
      date: fineractApiDateToFormString(transaction.date),
      code: transaction.type?.code,
      value: transaction.type?.value
    }));
    const active = loanIsActiveStatus(account.status);
    const blocked = account.multiDisburseLoan === true && account.isInterestRecalculationEnabled !== true;
    let payoff: LoanTopupPayoff | null = null;
    const date = transactionDate.trim();
    if (active && !blocked && date && parseFineractDateString(date)) {
      const quote = await fineract.get<unknown>(`/loans/${loanId}/transactions/template`, {
        command: 'prepayLoan',
        transactionDate: date,
        dateFormat: FINERACT_DATE_FORMAT,
        locale: FINERACT_LOCALE
      });
      payoff = normalizePayoff(quote);
    }

    return {
      ok: true,
      context: {
        accountNo: account.accountNo,
        productName: account.productName ?? account.loanProductName,
        currencyCode: account.currency.code,
        active,
        blocked,
        actualDisbursementDate,
        lastUserTransactionDate: lastTopupUserTransactionDate(actualDisbursementDate, transactions),
        payoff
      }
    };
  } catch (error) {
    if (error instanceof FineractHttpError && (error.status === 404 || error.status === 403)) {
      return { ok: false, message: 'Choose an active loan of this client' };
    }
    throw error;
  }
}

export async function listPendingTopupClosures(
  clientId: string | number,
  excludeLoanId?: number
): Promise<PendingTopupClosure[]> {
  const accounts = await getClientAccounts(clientId);
  const pending = (accounts.loanAccounts ?? []).filter(
    (loan) => loanIsPendingApprovalStatus(loan.status) && loan.id !== excludeLoanId
  );
  if (pending.length === 0) {
    return [];
  }
  const fineract = await createFineractClient();
  const snapshots = await Promise.all(
    pending.map(async (loan) => {
      try {
        const raw = await fineract.get<unknown>(`/loans/${loan.id}`);
        if (!raw || typeof raw !== 'object') {
          return null;
        }
        const row = raw as Record<string, unknown>;
        const closureLoanId = toNumber(row.closureLoanId);
        if (row.isTopup !== true || closureLoanId == null || closureLoanId <= 0) {
          return null;
        }
        return {
          loanId: loan.id,
          accountNo: loan.accountNo,
          closureLoanId
        } satisfies PendingTopupClosure;
      } catch {
        return null;
      }
    })
  );
  return snapshots.filter((item): item is PendingTopupClosure => item != null);
}
