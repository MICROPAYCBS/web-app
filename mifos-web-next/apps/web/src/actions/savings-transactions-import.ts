'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { toFineractActionError } from '@mifos/validation';
import { executeSavingsAccountTransactionCommandAction } from '@/actions/savings-account-command';
import { getBusinessDateContext } from '@/lib/fineract/business-date';
import {
  hasActiveCashierSession
} from '@/lib/fineract/cashier-cash-transaction-guard';
import { getCashierPolicySettings } from '@/lib/fineract/cashier-policy';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';
import { fetchSavingsAccountsList } from '@/lib/fineract/savings-accounts-list';
import type { SavingsAccountActionResult } from '@/lib/fineract/savings-account-action-result';
import { getServerSession } from '@/lib/session/server';
import { loadSavingsTransactionsImportPaymentTypes } from '@/lib/savings/savings-transactions-import-lookups';
import {
  accountNoText,
  analyzeSavingsTransactionImportRows,
  prepareSavingsTransactionImportRows,
  type SavingsTransactionImportAccountLookup,
  type SavingsTransactionsImportAnalysis,
  type SavingsTransactionsImportPreparedRow,
  type SavingsTransactionsImportWorkbookRawRow
} from '@/lib/savings/savings-transactions-import';

const SAVINGS_STATUS_ACTIVE = 'savingsAccountStatusType.active';

export type AnalyzeSavingsTransactionsImportResult =
  | {
      ok: true;
      analysis: SavingsTransactionsImportAnalysis;
      preparedRows: SavingsTransactionsImportPreparedRow[];
    }
  | { ok: false; message: string };

async function requireImportPermission(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session || !can(session, resolvePermission('savings.importTransactions'))) {
    return { ok: false, message: 'You do not have permission to import savings transactions.' };
  }
  return { ok: true };
}

function uniqueAccountNumbers(rows: SavingsTransactionsImportWorkbookRawRow[]): string[] {
  const seen = new Set<string>();
  const accountNos: string[] = [];
  for (const row of rows) {
    const accountNo = accountNoText(row.values['Account No']);
    if (!accountNo || seen.has(accountNo)) {
      continue;
    }
    seen.add(accountNo);
    accountNos.push(accountNo);
  }
  return accountNos;
}

async function lookupSavingsAccount(
  accountNo: string
): Promise<SavingsTransactionImportAccountLookup> {
  const page = await fetchSavingsAccountsList({
    accountNo,
    offset: 0,
    limit: 5,
    includeClosed: true
  });
  const matches = page.pageItems.filter((item) => item.accountNo.trim() === accountNo);
  if (matches.length === 0) {
    return { status: 'missing' };
  }
  if (matches.length > 1) {
    return { status: 'ambiguous' };
  }

  const listItem = matches[0];
  const detail = await getSavingsAccount(listItem.id).catch(() => null);
  const clientId = detail?.clientId ?? listItem.clientId;
  if (clientId == null) {
    return { status: 'missing' };
  }

  const status = detail?.status ?? listItem.status;
  const active =
    status?.active === true || status?.code === SAVINGS_STATUS_ACTIVE;
  const sub = detail?.subStatus;

  return {
    status: 'found',
    account: {
      id: listItem.id,
      accountNo: listItem.accountNo,
      clientId,
      clientName: detail?.clientName ?? listItem.clientName ?? '',
      active,
      blockAll: sub?.block === true,
      blockCredit: sub?.blockCredit === true,
      blockDebit: sub?.blockDebit === true
    }
  };
}

async function resolveImportAccounts(
  accountNos: string[]
): Promise<Record<string, SavingsTransactionImportAccountLookup>> {
  const entries = await Promise.all(
    accountNos.map(async (accountNo) => {
      const lookup = await lookupSavingsAccount(accountNo);
      return [accountNo, lookup] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function analyzeSavingsTransactionsImportAction(
  rows: SavingsTransactionsImportWorkbookRawRow[]
): Promise<AnalyzeSavingsTransactionsImportResult> {
  const allowed = await requireImportPermission();
  if (!allowed.ok) {
    return allowed;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: 'No transaction rows found in the Excel file.' };
  }

  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You do not have permission to import savings transactions.' };
  }

  try {
    const [accountsByAccountNo, paymentTypes, cashierPolicy, businessDateContext] =
      await Promise.all([
        resolveImportAccounts(uniqueAccountNumbers(rows)),
        loadSavingsTransactionsImportPaymentTypes(),
        getCashierPolicySettings(),
        getBusinessDateContext()
      ]);

    const activeCashier =
      session.officeId > 0
        ? await hasActiveCashierSession({
            userId: session.userId,
            officeId: session.officeId
          })
        : false;

    const analysis = analyzeSavingsTransactionImportRows(rows, {
      accountsByAccountNo,
      paymentTypes,
      businessDate: businessDateContext.date,
      canDeposit: can(session, 'DEPOSIT_SAVINGSACCOUNT'),
      canWithdraw: can(session, 'WITHDRAWAL_SAVINGSACCOUNT'),
      requireCashierForCash: cashierPolicy.requireCashierForCashTransactions,
      hasActiveCashierSession: activeCashier,
      cashDenominationsRequired:
        cashierPolicy.captureLegalTenderForCashTransactions === 'REQUIRED'
    });

    if (!analysis.canPost) {
      return { ok: true, analysis, preparedRows: [] };
    }

    const prepared = prepareSavingsTransactionImportRows(analysis);
    if (!prepared.ok) {
      return { ok: false, message: prepared.message };
    }

    return { ok: true, analysis, preparedRows: prepared.rows };
  } catch (error) {
    return toFineractActionError(error, 'Could not analyze the import file.');
  }
}

export async function postSavingsTransactionImportRowAction(
  row: SavingsTransactionsImportPreparedRow
): Promise<SavingsAccountActionResult> {
  const allowed = await requireImportPermission();
  if (!allowed.ok) {
    return allowed;
  }

  return executeSavingsAccountTransactionCommandAction(
    row.clientId,
    row.accountId,
    row.command,
    row.input
  );
}
