/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractLoanAccountDetail,
  FineractLoanAccountTransaction,
  FineractLoanTermVariation,
  LoanAccountSummaryMatrixRow
} from '@/lib/fineract/loan-account-types';
import { LOAN_ACCOUNT_STATUS } from '@/lib/fineract/account-field-officer-config';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import { clientAccountBackLabel } from '@/lib/fineract/clients-display';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { sortByDateThenId } from '@/lib/fineract/transaction-order';

export const LOAN_ACCOUNT_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'schedule', label: 'Repayment schedule' },
  { id: 'originalSchedule', label: 'Original schedule' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'charges', label: 'Charges' },
  { id: 'overdueCharges', label: 'Overdue charges' },
  { id: 'collateral', label: 'Collateral' },
  { id: 'guarantors', label: 'Guarantors' },
  { id: 'originators', label: 'Originators' },
  { id: 'tranches', label: 'Tranches' },
  { id: 'termVariations', label: 'Term variations' },
  { id: 'delinquency', label: 'Delinquency' },
  { id: 'reschedules', label: 'Reschedules' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'standingInstructions', label: 'Standing instructions' },
  { id: 'journalEntries', label: 'Journal entries' },
  { id: 'audit', label: 'Audit trail' }
] as const;

export type LoanAccountSectionId = (typeof LOAN_ACCOUNT_SECTIONS)[number]['id'];

export const LOAN_ACCOUNT_DEFAULT_SECTION: LoanAccountSectionId = 'summary';

export function loanAccountProductName(account: FineractLoanAccountDetail) {
  return account.productName ?? account.loanProductName ?? `Loan account #${account.id}`;
}

export function loanAccountClientBackLabel(account: FineractLoanAccountDetail): string {
  return clientAccountBackLabel(account.clientName);
}

export function loanAccountCurrencyCode(account: FineractLoanAccountDetail): string {
  return account.currency.code ?? 'USD';
}

export function formatLoanAccountMoney(
  account: FineractLoanAccountDetail,
  amount: number | undefined
) {
  return formatAccountMoney(amount, loanAccountCurrencyCode(account));
}

export function formatLoanAccountDate(value: number[] | string | undefined): string {
  return formatFineractDateArray(value, FINERACT_LOCALE) ?? '—';
}

export function loanAccountStatusVariant(
  code?: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (
    code.includes('closed') ||
    code.includes('reject') ||
    code.includes('withdrawn') ||
    code.includes('written')
  ) {
    return 'destructive';
  }
  return 'outline';
}

export function loanAccountHasSummary(account: FineractLoanAccountDetail): boolean {
  return account.summary != null;
}

export function loanAccountShowApprovedAmount(account: FineractLoanAccountDetail): boolean {
  const code = account.status.code ?? '';
  const value = account.status.value ?? '';
  return !(
    code === LOAN_ACCOUNT_STATUS.pending ||
    value === 'Submitted and pending approval' ||
    value === 'Withdrawn by applicant' ||
    value === 'Rejected'
  );
}

export function loanAccountShowDisbursedAmount(account: FineractLoanAccountDetail): boolean {
  const code = account.status.code ?? '';
  const value = account.status.value ?? '';
  return !(
    code === LOAN_ACCOUNT_STATUS.pending ||
    code === LOAN_ACCOUNT_STATUS.approved ||
    value === 'Submitted and pending approval' ||
    value === 'Withdrawn by applicant' ||
    value === 'Rejected' ||
    value === 'Approved'
  );
}

export function loanAccountHasChargebackTransaction(
  account: FineractLoanAccountDetail
): boolean {
  return (account.transactions ?? []).some(
    (transaction) => transaction.type?.code === 'loanTransactionType.chargeback'
  );
}

export function buildLoanAccountSummaryMatrix(
  account: FineractLoanAccountDetail
): LoanAccountSummaryMatrixRow[] {
  const summary = account.summary;
  if (!summary) {
    return [];
  }

  const principalAdjustments = summary.principalAdjustments ?? 0;

  return [
    {
      property: 'Principal',
      original: summary.totalPrincipal,
      adjustment: principalAdjustments,
      paid: summary.principalPaid,
      waived: summary.principalWaived,
      writtenOff: summary.principalWrittenOff,
      outstanding: summary.principalOutstanding,
      overdue: summary.principalOverdue
    },
    {
      property: 'Interest',
      original: summary.interestCharged,
      adjustment: 0,
      paid: summary.interestPaid,
      waived: summary.interestWaived,
      writtenOff: summary.interestWrittenOff,
      outstanding: summary.interestOutstanding,
      overdue: summary.interestOverdue
    },
    {
      property: 'Fees',
      original: summary.feeChargesCharged,
      adjustment: 0,
      paid: summary.feeChargesPaid,
      waived: summary.feeChargesWaived,
      writtenOff: summary.feeChargesWrittenOff,
      outstanding: summary.feeChargesOutstanding,
      overdue: summary.feeChargesOverdue
    },
    {
      property: 'Penalties',
      original: summary.penaltyChargesCharged,
      adjustment: 0,
      paid: summary.penaltyChargesPaid,
      waived: summary.penaltyChargesWaived,
      writtenOff: summary.penaltyChargesWrittenOff,
      outstanding: summary.penaltyChargesOutstanding,
      overdue: summary.penaltyChargesOverdue
    },
    {
      property: 'Total',
      original: summary.totalExpectedRepayment,
      adjustment: principalAdjustments,
      paid: summary.totalRepayment,
      waived: summary.totalWaived,
      writtenOff: summary.totalWrittenOff,
      outstanding: summary.totalOutstanding,
      overdue: summary.totalOverdue
    }
  ];
}

export function loanTransactionCurrencyCode(
  transaction: FineractLoanAccountTransaction,
  account?: FineractLoanAccountDetail
): string | undefined {
  return transaction.currency?.code ?? (account ? loanAccountCurrencyCode(account) : undefined);
}

export function loanTransactionHasRecordTimestamps(
  transaction: FineractLoanAccountTransaction
): boolean {
  return Boolean(transaction.submittedOnDate || transaction.createdDate || transaction.submittedByUsername);
}

export function formatLoanTransactionType(transaction: FineractLoanAccountTransaction) {
  return enumOptionLabel(transaction.type) ?? 'Transaction';
}

export function loanTransactionDate(
  transaction: FineractLoanAccountTransaction
): number[] | string | undefined {
  return transaction.date ?? transaction.submittedOnDate;
}

/** Newest first: transaction date, then id. */
export function sortLoanAccountTransactions(
  transactions: readonly FineractLoanAccountTransaction[]
): FineractLoanAccountTransaction[] {
  return sortByDateThenId(transactions, loanTransactionDate, (transaction) => transaction.id);
}

export function isLoanTransactionAccrual(transaction: FineractLoanAccountTransaction) {
  const code = transaction.type?.code?.toLowerCase() ?? '';
  const value = transaction.type?.value?.toLowerCase() ?? '';
  return code.includes('accrual') || value.includes('accrual');
}

export function loanTransactionRowClassName(
  transaction: FineractLoanAccountTransaction
): string | undefined {
  if (transaction.reversed) {
    return 'line-through opacity-60';
  }
  if (isLoanTransactionAccrual(transaction)) {
    return 'text-muted-foreground italic';
  }
  return undefined;
}

export function formatLoanChargeStatus(charge: {
  waived?: boolean;
  paid?: boolean;
  amountOutstanding?: number;
}) {
  if (charge.waived) {
    return 'Waived';
  }
  if (charge.paid) {
    return 'Paid';
  }
  if ((charge.amountOutstanding ?? 0) > 0) {
    return 'Outstanding';
  }
  return 'Active';
}

export function loanAccountTermLabel(account: FineractLoanAccountDetail): string | undefined {
  const count = account.loanTermFrequency;
  const frequency = enumOptionLabel(account.loanTermFrequencyType);
  if (count == null && !frequency) {
    return undefined;
  }
  if (count != null && frequency) {
    return `${count} ${frequency.toLowerCase()}`;
  }
  return frequency ?? String(count);
}

export function loanAccountInterestRateLabel(account: FineractLoanAccountDetail): string | undefined {
  if (account.interestRatePerPeriod == null) {
    return undefined;
  }
  const frequency = enumOptionLabel(account.interestRateFrequencyType);
  if (frequency) {
    return `${account.interestRatePerPeriod}% per ${frequency.replace(/s$/i, '').toLowerCase()}`;
  }
  return `${account.interestRatePerPeriod}%`;
}

export function loanAccountRepaymentFrequencyLabel(account: FineractLoanAccountDetail): string {
  const every = account.repaymentEvery;
  const frequency = enumOptionLabel(account.repaymentFrequencyType);
  if (every == null && !frequency) {
    return '—';
  }
  if (every != null && frequency) {
    return `${every} ${frequency.toLowerCase()}`;
  }
  return frequency ?? String(every);
}

/** True when any grace period on the loan is greater than zero. */
export function loanAccountHasGraceComponents(account: FineractLoanAccountDetail): boolean {
  return (
    (account.graceOnPrincipalPayment ?? 0) > 0 ||
    (account.graceOnInterestPayment ?? 0) > 0 ||
    (account.graceOnInterestCharged ?? 0) > 0 ||
    (account.graceOnArrearsAgeing ?? 0) > 0
  );
}

export function loanAccountHasLoanTerms(account: FineractLoanAccountDetail): boolean {
  return Boolean(
    account.transactionProcessingStrategyName ||
      account.amortizationType ||
      account.interestType ||
      account.numberOfRepayments != null ||
      account.repaymentEvery != null ||
      account.repaymentFrequencyType ||
      account.interestRatePerPeriod != null ||
      account.interestRateFrequencyType ||
      account.annualInterestRate != null ||
      account.loanTermFrequency != null ||
      account.loanTermFrequencyType ||
      account.interestCalculationPeriodType ||
      account.expectedFirstRepaymentOnDate ||
      account.interestChargedFromDate ||
      loanAccountHasGraceComponents(account)
  );
}

export function loanAccountHasPayoutConfiguration(account: FineractLoanAccountDetail): boolean {
  return (
    Boolean(account.linkedAccount) ||
    (account.linkAccountId != null && account.linkAccountId > 0) ||
    account.createStandingInstructionAtDisbursement === true
  );
}

export function loanAccountIsActive(account: FineractLoanAccountDetail): boolean {
  const value = account.status.value ?? '';
  return value === 'Active' || account.status.active === true;
}

export function loanAccountHasOriginalSchedule(account: FineractLoanAccountDetail): boolean {
  return Boolean(account.originalSchedule?.periods?.length);
}

export function loanAccountHasOverdueCharges(account: FineractLoanAccountDetail): boolean {
  return (account.overdueCharges?.length ?? 0) > 0;
}

export function loanAccountIsMultiDisburse(account: FineractLoanAccountDetail): boolean {
  return account.multiDisburseLoan === true;
}

export function loanAccountHasTermVariations(account: FineractLoanAccountDetail): boolean {
  return (account.loanTermVariations?.length ?? 0) > 0;
}

export type LoanTermVariationGroupId =
  | 'emiAmount'
  | 'interestRate'
  | 'dueDate'
  | 'deleteInstallment'
  | 'insertInstallment'
  | 'principalAmount'
  | 'graceOnInterest'
  | 'graceOnPrincipal'
  | 'extendRepaymentPeriod'
  | 'interestRateForInstallment'
  | 'interestPause'
  | 'other';

export const LOAN_TERM_VARIATION_GROUP_LABELS: Record<LoanTermVariationGroupId, string> = {
  emiAmount: 'EMI amount',
  interestRate: 'Interest rate',
  dueDate: 'Due date',
  deleteInstallment: 'Deleted installments',
  insertInstallment: 'Inserted installments',
  principalAmount: 'Principal amount',
  graceOnInterest: 'Interest grace',
  graceOnPrincipal: 'Principal grace',
  extendRepaymentPeriod: 'Extended repayment period',
  interestRateForInstallment: 'Interest rate from installment',
  interestPause: 'Interest pauses',
  other: 'Other variations'
};

export function loanTermVariationGroupId(
  variation: FineractLoanTermVariation
): LoanTermVariationGroupId {
  const value = variation.termType?.value ?? '';
  switch (value) {
    case 'emiAmount':
    case 'interestRate':
    case 'dueDate':
    case 'deleteInstallment':
    case 'insertInstallment':
    case 'principalAmount':
    case 'graceOnInterest':
    case 'graceOnPrincipal':
    case 'extendRepaymentPeriod':
    case 'interestRateForInstallment':
    case 'interestPause':
      return value;
    default:
      return 'other';
  }
}

export function groupLoanTermVariations(
  variations: FineractLoanTermVariation[]
): Array<{ id: LoanTermVariationGroupId; label: string; rows: FineractLoanTermVariation[] }> {
  const buckets = new Map<LoanTermVariationGroupId, FineractLoanTermVariation[]>();
  for (const variation of variations) {
    const id = loanTermVariationGroupId(variation);
    const existing = buckets.get(id);
    if (existing) {
      existing.push(variation);
    } else {
      buckets.set(id, [variation]);
    }
  }
  return Array.from(buckets.entries()).map(([id, rows]) => ({
    id,
    label: LOAN_TERM_VARIATION_GROUP_LABELS[id],
    rows
  }));
}

export function loanAccountLinkedAccountLabel(
  account: FineractLoanAccountDetail
): string | null {
  const linked = account.linkedAccount;
  if (linked) {
    const parts = [linked.productName, linked.accountNo].filter(Boolean);
    return parts.length ? parts.join(' · ') : `Savings account #${linked.id}`;
  }
  if (account.linkAccountId != null && account.linkAccountId > 0) {
    return `Savings account #${account.linkAccountId}`;
  }
  return null;
}

export function loanAccountLinkedAccountId(account: FineractLoanAccountDetail): number | undefined {
  return account.linkedAccount?.id ?? account.linkAccountId;
}

export function loanAccountStandingInstructionAtDisbursementLabel(
  account: FineractLoanAccountDetail
): string {
  return account.createStandingInstructionAtDisbursement === true ? 'Yes' : 'No';
}

export type LoanAccountSectionVisibilityOptions = {
  standingInstructions?: boolean;
  reschedules?: boolean;
  notes?: boolean;
  canCreateInterestPause?: boolean;
};

export function loanAccountVisibleSections(
  account: FineractLoanAccountDetail,
  options?: LoanAccountSectionVisibilityOptions
): LoanAccountSectionId[] {
  return LOAN_ACCOUNT_SECTIONS.map((section) => section.id).filter((id) => {
    if (id === 'schedule') {
      return Boolean(account.repaymentSchedule?.periods?.length);
    }
    if (id === 'originalSchedule') {
      return loanAccountHasOriginalSchedule(account);
    }
    if (id === 'transactions') {
      return (account.transactions?.length ?? 0) > 0 || loanAccountHasSummary(account);
    }
    if (
      id === 'charges' ||
      id === 'collateral' ||
      id === 'guarantors' ||
      id === 'originators' ||
      id === 'documents'
    ) {
      return true;
    }
    if (id === 'overdueCharges') {
      return loanAccountHasOverdueCharges(account);
    }
    if (id === 'tranches') {
      return loanAccountIsMultiDisburse(account);
    }
    if (id === 'termVariations') {
      return (
        loanAccountHasTermVariations(account) ||
        (loanAccountIsActive(account) && Boolean(options?.canCreateInterestPause))
      );
    }
    if (id === 'delinquency') {
      return loanAccountIsActive(account);
    }
    if (id === 'notes') {
      return Boolean(options?.notes);
    }
    if (id === 'reschedules') {
      return Boolean(options?.reschedules);
    }
    if (id === 'standingInstructions') {
      return Boolean(options?.standingInstructions) && loanAccountHasSummary(account);
    }
    return true;
  });
}

export function loanAccountDelinquencyBanner(
  account: FineractLoanAccountDetail
): string | null {
  const parts: string[] = [];
  if (account.delinquencyRange?.classification) {
    parts.push(`Delinquency classification: ${account.delinquencyRange.classification}`);
  }
  if (account.delinquent?.pastDueDays && account.delinquent.pastDueDays > 0) {
    parts.push(`${account.delinquent.pastDueDays} past due days`);
  }
  if (
    account.delinquent?.delinquentDays &&
    account.delinquent.delinquentDays > 0 &&
    account.delinquent.delinquentDays !== account.delinquent.pastDueDays
  ) {
    parts.push(`${account.delinquent.delinquentDays} delinquent days`);
  }
  return parts.length ? parts.join(' · ') : null;
}
