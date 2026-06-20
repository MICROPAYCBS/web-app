import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientAccountStatus,
  FineractCurrencyOption,
  FineractEnumOption,
  FineractSavingsAccountCharge,
  FineractSavingsAccountDetail,
  FineractSavingsAccountSummary,
  FineractSavingsAccountTimeline,
  FineractSavingsAccountTransaction
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const SAVINGS_ACCOUNTS_PATH = '/savingsaccounts';

function normalizeEnumOption(raw: unknown): FineractEnumOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const code = typeof row.code === 'string' ? row.code : undefined;
  const value = typeof row.value === 'string' ? row.value : undefined;
  if (!Number.isFinite(id) || !value) {
    return undefined;
  }
  return { id, code, value };
}

function normalizeCurrency(raw: unknown): FineractCurrencyOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const code = typeof row.code === 'string' ? row.code : undefined;
  if (!code) {
    return undefined;
  }
  return {
    code,
    name: typeof row.name === 'string' ? row.name : code,
    decimalPlaces: typeof row.decimalPlaces === 'number' ? row.decimalPlaces : undefined
  };
}

function normalizeStatus(raw: unknown): FineractClientAccountStatus | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : undefined;
  if (!Number.isFinite(id) || !value) {
    return undefined;
  }
  return {
    id,
    code: typeof row.code === 'string' ? row.code : undefined,
    value,
    active: row.active === true,
    submittedAndPendingApproval: row.submittedAndPendingApproval === true,
    pendingApproval: row.pendingApproval === true,
    overpaid: row.overpaid === true,
    transferInProgress: row.transferInProgress === true,
    transferOnHold: row.transferOnHold === true
  };
}

function normalizeSummary(raw: unknown): FineractSavingsAccountSummary | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const num = (key: string) => {
    const value = row[key];
    return typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : undefined;
  };
  return {
    totalDeposits: num('totalDeposits'),
    totalWithdrawals: num('totalWithdrawals'),
    totalInterestEarned: num('totalInterestEarned'),
    totalInterestPosted: num('totalInterestPosted'),
    accountBalance: num('accountBalance'),
    availableBalance: num('availableBalance'),
    totalFeeCharge: num('totalFeeCharge'),
    totalPenaltyCharge: num('totalPenaltyCharge'),
    totalAnnualFees: num('totalAnnualFees'),
    totalOverdraftInterestDerived: num('totalOverdraftInterestDerived'),
    interestNotPosted: num('interestNotPosted')
  };
}

function normalizeTimeline(raw: unknown): FineractSavingsAccountTimeline | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    submittedOnDate: row.submittedOnDate as FineractSavingsAccountTimeline['submittedOnDate'],
    submittedByUsername: typeof row.submittedByUsername === 'string' ? row.submittedByUsername : undefined,
    submittedByFirstname:
      typeof row.submittedByFirstname === 'string' ? row.submittedByFirstname : undefined,
    submittedByLastname:
      typeof row.submittedByLastname === 'string' ? row.submittedByLastname : undefined,
    approvedOnDate: row.approvedOnDate as FineractSavingsAccountTimeline['approvedOnDate'],
    approvedByUsername: typeof row.approvedByUsername === 'string' ? row.approvedByUsername : undefined,
    activatedOnDate: row.activatedOnDate as FineractSavingsAccountTimeline['activatedOnDate'],
    activatedByUsername:
      typeof row.activatedByUsername === 'string' ? row.activatedByUsername : undefined,
    closedOnDate: row.closedOnDate as FineractSavingsAccountTimeline['closedOnDate'],
    closedByUsername: typeof row.closedByUsername === 'string' ? row.closedByUsername : undefined
  };
}

function normalizeTransaction(raw: unknown): FineractSavingsAccountTransaction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const amount = Number(row.amount);
  if (!Number.isFinite(id) || !Number.isFinite(amount)) {
    return null;
  }
  return {
    id,
    amount,
    runningBalance:
      typeof row.runningBalance === 'number'
        ? row.runningBalance
        : Number.isFinite(Number(row.runningBalance))
          ? Number(row.runningBalance)
          : undefined,
    transactionType: row.transactionType as FineractSavingsAccountTransaction['transactionType'],
    entryType: row.entryType as FineractSavingsAccountTransaction['entryType'],
    submittedOnDate: row.submittedOnDate as FineractSavingsAccountTransaction['submittedOnDate'],
    createdDate: row.createdDate as FineractSavingsAccountTransaction['createdDate'],
    reversed: row.reversed === true,
    paymentDetailData:
      row.paymentDetailData as FineractSavingsAccountTransaction['paymentDetailData'],
    submittedByUsername:
      typeof row.submittedByUsername === 'string' ? row.submittedByUsername : undefined
  };
}

function normalizeCharge(raw: unknown): FineractSavingsAccountCharge | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  const num = (key: string) => {
    const value = row[key];
    return typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : undefined;
  };
  return {
    id,
    name,
    chargeId: Number.isFinite(Number(row.chargeId)) ? Number(row.chargeId) : undefined,
    chargeTimeType: normalizeEnumOption(row.chargeTimeType),
    dueDate: row.dueDate as FineractSavingsAccountCharge['dueDate'],
    amount: num('amount'),
    amountPaid: num('amountPaid'),
    amountWaived: num('amountWaived'),
    amountWrittenOff: num('amountWrittenOff'),
    amountOutstanding: num('amountOutstanding'),
    chargeCalculationType: normalizeEnumOption(row.chargeCalculationType),
    penalty: row.penalty === true,
    isActive: row.isActive === true,
    isPaid: row.isPaid === true,
    isWaived: row.isWaived === true
  };
}

function normalizeSavingsAccountDetail(raw: unknown): FineractSavingsAccountDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const accountNo = typeof row.accountNo === 'string' ? row.accountNo : '';
  const status = normalizeStatus(row.status);
  const currency = normalizeCurrency(row.currency);
  if (!Number.isFinite(id) || !accountNo || !status || !currency) {
    return null;
  }

  const subStatusRaw = row.subStatus;
  const subStatus =
    subStatusRaw && typeof subStatusRaw === 'object'
      ? {
          block: (subStatusRaw as Record<string, unknown>).block === true,
          blockCredit: (subStatusRaw as Record<string, unknown>).blockCredit === true,
          blockDebit: (subStatusRaw as Record<string, unknown>).blockDebit === true
        }
      : undefined;

  return {
    id,
    accountNo,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    clientId: Number.isFinite(Number(row.clientId)) ? Number(row.clientId) : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    savingsProductId: Number.isFinite(Number(row.savingsProductId))
      ? Number(row.savingsProductId)
      : undefined,
    savingsProductName:
      typeof row.savingsProductName === 'string' ? row.savingsProductName : undefined,
    productName:
      typeof row.productName === 'string'
        ? row.productName
        : typeof row.savingsProductName === 'string'
          ? row.savingsProductName
          : undefined,
    shortProductName:
      typeof row.shortProductName === 'string' ? row.shortProductName : undefined,
    status,
    subStatus,
    currency,
    depositType: normalizeEnumOption(row.depositType),
    nominalAnnualInterestRate:
      typeof row.nominalAnnualInterestRate === 'number'
        ? row.nominalAnnualInterestRate
        : Number.isFinite(Number(row.nominalAnnualInterestRate))
          ? Number(row.nominalAnnualInterestRate)
          : undefined,
    interestCompoundingPeriodType: normalizeEnumOption(row.interestCompoundingPeriodType),
    interestCalculationType: normalizeEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: normalizeEnumOption(row.interestCalculationDaysInYearType),
    lastActiveTransactionDate: row.lastActiveTransactionDate as
      | FineractSavingsAccountDetail['lastActiveTransactionDate']
      | undefined,
    onHoldFunds:
      typeof row.onHoldFunds === 'number'
        ? row.onHoldFunds
        : Number.isFinite(Number(row.onHoldFunds))
          ? Number(row.onHoldFunds)
          : undefined,
    savingsAmountOnHold:
      typeof row.savingsAmountOnHold === 'number'
        ? row.savingsAmountOnHold
        : Number.isFinite(Number(row.savingsAmountOnHold))
          ? Number(row.savingsAmountOnHold)
          : undefined,
    summary: normalizeSummary(row.summary),
    timeline: normalizeTimeline(row.timeline),
    transactions: Array.isArray(row.transactions)
      ? row.transactions
          .map((item) => normalizeTransaction(item))
          .filter((item): item is FineractSavingsAccountTransaction => item !== null)
      : undefined,
    charges: Array.isArray(row.charges)
      ? row.charges
          .map((item) => normalizeCharge(item))
          .filter((item): item is FineractSavingsAccountCharge => item !== null)
      : undefined,
    fieldOfficerName:
      typeof row.fieldOfficerName === 'string' ? row.fieldOfficerName : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined
  };
}

export async function getSavingsAccount(
  accountId: string | number
): Promise<FineractSavingsAccountDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SAVINGS_ACCOUNTS_PATH}/${accountId}`, {
    associations: 'all'
  });
  return normalizeSavingsAccountDetail(raw);
}
