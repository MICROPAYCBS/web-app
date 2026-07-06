/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { format } from 'date-fns';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { loanAccountProductName } from '@/lib/fineract/loan-account-display';
import { DEFAULT_REPORT_ORG_NAME } from '@/lib/fineract/report-branding';
import {
  formatScheduleMoney,
  installmentAmount,
  scheduleCurrencyCode,
  scheduleHighlights
} from '@/components/clients/loan-account/schedule/loan-schedule-format';

export type LoanRepaymentScheduleRow = {
  key: string;
  period: string;
  dueDate: string;
  daysInPeriod: string;
  principalDue: string;
  interestDue: string;
  feesDue: string;
  installment: string;
  balance: string;
  note?: string;
};

export type LoanRepaymentScheduleDocumentData = {
  orgName: string;
  generatedOnLabel: string;
  clientName: string;
  accountNo: string;
  productName: string;
  loanStatus: string;
  currencyCode: string;
  officeName?: string;
  loanOfficerName?: string;
  principalDisbursedLabel: string;
  principalExpectedLabel: string;
  totalInterestLabel: string;
  totalFeesLabel: string;
  totalRepaymentLabel: string;
  loanTermLabel: string;
  installmentCountLabel: string;
  firstRepaymentLabel: string;
  lastRepaymentLabel: string;
  averageInstallmentLabel: string;
  rows: LoanRepaymentScheduleRow[];
};

export function resolveLoanScheduleOrgName(orgName?: string | null): string {
  const trimmed = orgName?.trim();
  return trimmed || DEFAULT_REPORT_ORG_NAME;
}

function periodNote(period: NonNullable<LoanScheduleData['periods']>[number]): string | undefined {
  if (period.period === 0) {
    return 'Disbursement';
  }
  if (period.downPaymentPeriod) {
    return 'Down payment';
  }
  return undefined;
}

function buildScheduleRows(
  schedule: LoanScheduleData,
  currencyCode: string
): LoanRepaymentScheduleRow[] {
  return (schedule.periods ?? []).map((row, index) => {
    const isDisbursement = row.period === 0;
    const note = periodNote(row);
    return {
      key: `period-${row.period ?? index}`,
      period: row.period != null ? String(row.period) : '—',
      dueDate: row.dueDate ?? '—',
      daysInPeriod: row.daysInPeriod != null ? String(row.daysInPeriod) : '—',
      principalDue: isDisbursement ? '—' : formatScheduleMoney(row.principalDue, currencyCode),
      interestDue: isDisbursement ? '—' : formatScheduleMoney(row.interestDue, currencyCode),
      feesDue: formatScheduleMoney(row.feeChargesDue, currencyCode),
      installment: isDisbursement
        ? formatScheduleMoney(row.principalDisbursed, currencyCode)
        : formatScheduleMoney(installmentAmount(row), currencyCode),
      balance: formatScheduleMoney(row.principalLoanBalanceOutstanding, currencyCode),
      note
    };
  });
}

export function buildLoanRepaymentScheduleDocumentData(input: {
  account: FineractLoanAccountDetail;
  schedule: LoanScheduleData;
  orgName?: string | null;
  generatedOn?: Date;
}): LoanRepaymentScheduleDocumentData {
  const { account, schedule, orgName, generatedOn = new Date() } = input;
  const currencyCode = scheduleCurrencyCode(schedule);
  const highlights = scheduleHighlights(schedule);

  return {
    orgName: resolveLoanScheduleOrgName(orgName),
    generatedOnLabel: format(generatedOn, FINERACT_DATE_FORMAT),
    clientName: account.clientName?.trim() || '—',
    accountNo: account.accountNo,
    productName: loanAccountProductName(account),
    loanStatus: account.status.value ?? '—',
    currencyCode,
    officeName: account.officeName,
    loanOfficerName: account.loanOfficerName,
    principalDisbursedLabel: formatScheduleMoney(schedule.totalPrincipalDisbursed, currencyCode),
    principalExpectedLabel: formatScheduleMoney(schedule.totalPrincipalExpected, currencyCode),
    totalInterestLabel: formatScheduleMoney(schedule.totalInterestCharged, currencyCode),
    totalFeesLabel: formatScheduleMoney(schedule.totalFeeChargesCharged, currencyCode),
    totalRepaymentLabel: formatScheduleMoney(schedule.totalRepaymentExpected, currencyCode),
    loanTermLabel:
      schedule.loanTermInDays != null ? `${schedule.loanTermInDays} days` : '—',
    installmentCountLabel:
      highlights.installmentCount > 0 ? String(highlights.installmentCount) : '—',
    firstRepaymentLabel: highlights.firstRepaymentDate ?? '—',
    lastRepaymentLabel: highlights.lastRepaymentDate ?? '—',
    averageInstallmentLabel: formatScheduleMoney(highlights.averageInstallment, currencyCode),
    rows: buildScheduleRows(schedule, currencyCode)
  };
}

export function loanRepaymentScheduleFileName(accountNo: string, generatedOn: Date = new Date()): string {
  return `loan_schedule_${accountNo}_${format(generatedOn, 'yyyyMMdd')}.pdf`;
}
