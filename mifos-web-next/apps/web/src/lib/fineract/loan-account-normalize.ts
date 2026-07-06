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
  FineractEnumOption
} from '@mifos/api-client';
import type {
  FineractLoanAccountCharge,
  FineractLoanAccountDetail,
  FineractLoanAccountDisbursementDetail,
  FineractLoanAccountLinkedAccount,
  FineractLoanAccountSummary,
  FineractLoanAccountTimeline,
  FineractLoanAccountTransaction
} from '@/lib/fineract/loan-account-types';
import { normalizeLoanScheduleData } from '@/lib/fineract/loan-schedule-normalize';

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

function normalizeEnumOption(raw: unknown): FineractEnumOption | undefined {
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
    value
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
    pendingApproval: row.pendingApproval === true
  };
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

function normalizeDateField(raw: unknown): number[] | string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    return raw as number[];
  }
  return undefined;
}

function normalizeSummary(raw: unknown): FineractLoanAccountSummary | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const pick = (key: string) => toNumber(row[key]);

  return {
    totalPrincipal: pick('totalPrincipal'),
    principalAdjustments: pick('principalAdjustments'),
    principalPaid: pick('principalPaid'),
    principalWaived: pick('principalWaived'),
    principalWrittenOff: pick('principalWrittenOff'),
    principalOutstanding: pick('principalOutstanding'),
    principalOverdue: pick('principalOverdue'),
    interestCharged: pick('interestCharged'),
    interestPaid: pick('interestPaid'),
    interestWaived: pick('interestWaived'),
    interestWrittenOff: pick('interestWrittenOff'),
    interestOutstanding: pick('interestOutstanding'),
    interestOverdue: pick('interestOverdue'),
    feeChargesCharged: pick('feeChargesCharged'),
    feeChargesPaid: pick('feeChargesPaid'),
    feeChargesWaived: pick('feeChargesWaived'),
    feeChargesWrittenOff: pick('feeChargesWrittenOff'),
    feeChargesOutstanding: pick('feeChargesOutstanding'),
    feeChargesOverdue: pick('feeChargesOverdue'),
    penaltyChargesCharged: pick('penaltyChargesCharged'),
    penaltyChargesPaid: pick('penaltyChargesPaid'),
    penaltyChargesWaived: pick('penaltyChargesWaived'),
    penaltyChargesWrittenOff: pick('penaltyChargesWrittenOff'),
    penaltyChargesOutstanding: pick('penaltyChargesOutstanding'),
    penaltyChargesOverdue: pick('penaltyChargesOverdue'),
    totalExpectedRepayment: pick('totalExpectedRepayment'),
    totalRepayment: pick('totalRepayment'),
    totalWaived: pick('totalWaived'),
    totalWrittenOff: pick('totalWrittenOff'),
    totalOutstanding: pick('totalOutstanding'),
    totalOverdue: pick('totalOverdue'),
    overdueSinceDate: normalizeDateField(row.overdueSinceDate)
  };
}

function normalizeTimeline(raw: unknown): FineractLoanAccountTimeline | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    submittedOnDate: normalizeDateField(row.submittedOnDate),
    submittedByUsername:
      typeof row.submittedByUsername === 'string' ? row.submittedByUsername : undefined,
    approvedOnDate: normalizeDateField(row.approvedOnDate),
    approvedByUsername:
      typeof row.approvedByUsername === 'string' ? row.approvedByUsername : undefined,
    expectedDisbursementDate: normalizeDateField(row.expectedDisbursementDate),
    actualDisbursementDate: normalizeDateField(row.actualDisbursementDate),
    disbursedByUsername:
      typeof row.disbursedByUsername === 'string' ? row.disbursedByUsername : undefined,
    expectedMaturityDate: normalizeDateField(row.expectedMaturityDate),
    closedOnDate: normalizeDateField(row.closedOnDate),
    closedByUsername: typeof row.closedByUsername === 'string' ? row.closedByUsername : undefined
  };
}

function normalizeTransaction(raw: unknown): FineractLoanAccountTransaction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const amount = toNumber(row.amount);
  if (!Number.isFinite(id) || amount == null) {
    return null;
  }
  return {
    id,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    type: normalizeEnumOption(row.type),
    date: normalizeDateField(row.date),
    submittedOnDate: normalizeDateField(row.submittedOnDate),
    amount,
    outstandingLoanBalance: toNumber(row.outstandingLoanBalance),
    manuallyReversed: row.manuallyReversed === true,
    reversed: row.reversed === true || row.manuallyReversed === true,
    note: typeof row.note === 'string' ? row.note : undefined,
    currency: normalizeCurrency(row.currency)
  };
}

function normalizeLinkedAccount(raw: unknown): FineractLoanAccountLinkedAccount | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return undefined;
  }
  return {
    id,
    accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
    productName: typeof row.productName === 'string' ? row.productName : undefined
  };
}

function normalizeDisbursementDetail(raw: unknown): FineractLoanAccountDisbursementDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const principal = toNumber(row.principal);
  const netDisbursalAmount = toNumber(row.netDisbursalAmount);
  const expectedDisbursementDate = normalizeDateField(row.expectedDisbursementDate);
  const actualDisbursementDate = normalizeDateField(row.actualDisbursementDate);
  const note = typeof row.note === 'string' ? row.note.trim() : undefined;
  const id = toNumber(row.id);

  if (
    principal == null &&
    netDisbursalAmount == null &&
    !expectedDisbursementDate &&
    !actualDisbursementDate &&
    !note
  ) {
    return null;
  }

  return {
    id: id != null && Number.isFinite(id) ? id : undefined,
    expectedDisbursementDate,
    actualDisbursementDate,
    principal,
    netDisbursalAmount,
    note: note || undefined
  };
}

function normalizeDisbursementDetails(raw: unknown): FineractLoanAccountDisbursementDetail[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const details = raw
    .map((item) => normalizeDisbursementDetail(item))
    .filter((item): item is FineractLoanAccountDisbursementDetail => item != null);
  return details.length ? details : undefined;
}

function normalizeCharge(raw: unknown): FineractLoanAccountCharge | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : undefined;
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    chargeId: toNumber(row.chargeId),
    name,
    chargeTimeType: normalizeEnumOption(row.chargeTimeType),
    dueDate: normalizeDateField(row.dueDate),
    amount: toNumber(row.amount),
    amountPaid: toNumber(row.amountPaid),
    amountWaived: toNumber(row.amountWaived),
    amountWrittenOff: toNumber(row.amountWrittenOff),
    amountOutstanding: toNumber(row.amountOutstanding),
    chargeCalculationType: normalizeEnumOption(row.chargeCalculationType),
    penalty: row.penalty === true,
    paid: row.paid === true,
    waived: row.waived === true
  };
}

export function normalizeLoanAccountDetail(raw: unknown): FineractLoanAccountDetail | null {
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

  const transactions = Array.isArray(row.transactions)
    ? row.transactions
        .map((item) => normalizeTransaction(item))
        .filter((item): item is FineractLoanAccountTransaction => item != null)
    : undefined;

  const charges = Array.isArray(row.charges)
    ? row.charges
        .map((item) => normalizeCharge(item))
        .filter((item): item is FineractLoanAccountCharge => item != null)
    : undefined;

  const delinquentRaw = row.delinquent;
  const delinquent =
    delinquentRaw && typeof delinquentRaw === 'object'
      ? {
          pastDueDays: toNumber((delinquentRaw as Record<string, unknown>).pastDueDays),
          delinquentDays: toNumber((delinquentRaw as Record<string, unknown>).delinquentDays)
        }
      : undefined;

  const delinquencyRangeRaw = row.delinquencyRange;
  const delinquencyRange =
    delinquencyRangeRaw && typeof delinquencyRangeRaw === 'object'
      ? {
          classification:
            typeof (delinquencyRangeRaw as Record<string, unknown>).classification === 'string'
              ? ((delinquencyRangeRaw as Record<string, unknown>).classification as string)
              : undefined
        }
      : undefined;

  const summary = normalizeSummary(row.summary);
  const summaryRow =
    row.summary && typeof row.summary === 'object'
      ? (row.summary as Record<string, unknown>)
      : undefined;
  const linkedAccount =
    normalizeLinkedAccount(row.linkedAccount) ??
    (summaryRow ? normalizeLinkedAccount(summaryRow.linkedAccount) : undefined);
  const linkAccountId = toNumber(row.linkAccountId) ?? linkedAccount?.id;
  const createStandingInstructionAtDisbursement =
    row.createStandingInstructionAtDisbursement === true;
  const disbursementDetails =
    normalizeDisbursementDetails(row.disbursementDetails) ??
    (summaryRow ? normalizeDisbursementDetails(summaryRow.disbursementDetails) : undefined);

  return {
    id,
    accountNo,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    clientId: Number.isFinite(Number(row.clientId)) ? Number(row.clientId) : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    loanProductId: Number.isFinite(Number(row.loanProductId))
      ? Number(row.loanProductId)
      : undefined,
    loanProductName:
      typeof row.loanProductName === 'string' ? row.loanProductName : undefined,
    productName:
      typeof row.productName === 'string'
        ? row.productName
        : typeof row.loanProductName === 'string'
          ? row.loanProductName
          : undefined,
    loanType: normalizeEnumOption(row.loanType),
    status,
    currency,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    loanOfficerId: Number.isFinite(Number(row.loanOfficerId))
      ? Number(row.loanOfficerId)
      : undefined,
    loanOfficerName:
      typeof row.loanOfficerName === 'string' ? row.loanOfficerName : undefined,
    loanPurposeName:
      typeof row.loanPurposeName === 'string' ? row.loanPurposeName : undefined,
    writeOffReason:
      typeof row.writeOffReason === 'string' ? row.writeOffReason : undefined,
    transactionProcessingStrategyName:
      typeof row.transactionProcessingStrategyName === 'string'
        ? row.transactionProcessingStrategyName
        : undefined,
    proposedPrincipal: toNumber(row.proposedPrincipal),
    approvedPrincipal: toNumber(row.approvedPrincipal),
    principal: toNumber(row.principal),
    numberOfRepayments: toNumber(row.numberOfRepayments),
    repaymentEvery: toNumber(row.repaymentEvery),
    repaymentFrequencyType: normalizeEnumOption(row.repaymentFrequencyType),
    amortizationType: normalizeEnumOption(row.amortizationType),
    interestType: normalizeEnumOption(row.interestType),
    interestRatePerPeriod: toNumber(row.interestRatePerPeriod),
    interestCalculationPeriodType: normalizeEnumOption(row.interestCalculationPeriodType),
    annualInterestRate: toNumber(row.annualInterestRate),
    inArrears: row.inArrears === true,
    totalOverpaid: toNumber(row.totalOverpaid),
    summary,
    timeline: normalizeTimeline(row.timeline),
    repaymentSchedule: normalizeLoanScheduleData(row.repaymentSchedule),
    transactions,
    charges,
    delinquent,
    delinquencyRange,
    linkedAccount,
    linkAccountId,
    createStandingInstructionAtDisbursement,
    disbursementDetails
  };
}
