import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { format, startOfMonth } from 'date-fns';
import {
  parseActiveLoansSummaryHealth,
  parseBranchLoanHealthFromReportRows,
  parsePortfolioAtRiskPercent,
  sumDisbursedAmountFromReportRows
} from '@/lib/dashboard/dashboard-kpi-parse';
import type { DashboardKpiFetchOptions, DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';
import { resolveDashboardReportCurrencyId } from '@/lib/dashboard/dashboard-currency';
import { formatCashierNavBalanceLabel } from '@/lib/fineract/cashier-display';
import { loadCashierNavBalanceForSession } from '@/lib/fineract/load-cashier-nav-balance';
import { fetchExpectedCollectionsToday } from '@/lib/fineract/collection-sheet';
import { getCheckerInboxPendingCount } from '@/lib/fineract/checker-inbox';
import { createFineractClient } from '@/lib/fineract/create-client';
import { FINERACT_DATE_FORMAT, parseFineractDateString } from '@/lib/fineract/dates';
import { buildReportRunQueryParams } from '@/lib/fineract/report-run-display';
import { runReport, tryRunReport } from '@/lib/fineract/run-reports';
import type { ServerSession } from '@/lib/session/types';

interface PagedTotalResponse {
  totalFilteredRecords?: number;
}

async function fetchPagedTotal(
  path: string,
  params: Record<string, string> = {}
): Promise<number | null> {
  try {
    const fineract = await createFineractClient();
    const raw = await fineract.get<PagedTotalResponse>(path, {
      offset: '0',
      limit: '1',
      paged: 'true',
      ...params
    });
    const total = Number(raw.totalFilteredRecords);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

function clientOfficeParams(officeId: number | null): Record<string, string> {
  if (officeId == null) {
    return {};
  }
  return { officeId: String(officeId) };
}

function toIsoDate(businessDate: string): string | null {
  const parsed = parseFineractDateString(businessDate);
  if (!parsed) {
    return null;
  }
  return format(parsed, 'yyyy-MM-dd');
}

function monthStartIsoDate(businessDate: string): string | null {
  const parsed = parseFineractDateString(businessDate);
  if (!parsed) {
    return null;
  }
  return format(startOfMonth(parsed), 'yyyy-MM-dd');
}

async function fetchClientCounts(
  officeId: number | null
): Promise<DashboardKpis['customers']> {
  const officeParams = clientOfficeParams(officeId);
  const [total, active] = await Promise.all([
    fetchPagedTotal('/clients', officeParams),
    fetchPagedTotal('/clients', { ...officeParams, status: 'active' })
  ]);
  return { total, active };
}

async function fetchLoanStatusCount(status: string): Promise<number | null> {
  return fetchPagedTotal('/loans', { status });
}

async function fetchLoanCounts(): Promise<
  Pick<DashboardKpis['loans'], 'active' | 'pendingApproval' | 'pendingDisbursal'>
> {
  const [active, pendingApproval, pendingDisbursal] = await Promise.all([
    fetchLoanStatusCount('300'),
    fetchLoanStatusCount('100'),
    fetchLoanStatusCount('200')
  ]);
  return { active, pendingApproval, pendingDisbursal };
}

async function fetchSavingsCount(): Promise<number | null> {
  return fetchPagedTotal('/savingsaccounts');
}

async function fetchLoanHealthFromReports(
  officeId: number | null,
  currencyCode: string | null
): Promise<Pick<DashboardKpis['loans'], 'inArrears' | 'portfolioAtRiskPercent'>> {
  if (officeId == null) {
    return { inArrears: null, portfolioAtRiskPercent: null };
  }

  const reportCurrencyId = resolveDashboardReportCurrencyId(currencyCode);
  const activeLoansParams = buildReportRunQueryParams({
    officeId: String(officeId),
    parType: '1',
    currencyId: reportCurrencyId,
    loanProductId: '-1',
    loanOfficerId: '-1',
    fundId: '-1',
    loanPurposeId: '-1'
  });
  const activeLoansSummary = await tryRunReport('Active Loans - Summary', {
    ...activeLoansParams,
    genericResultSet: 'false'
  });
  if (activeLoansSummary) {
    const fromSummary = parseActiveLoansSummaryHealth(activeLoansSummary);
    if (fromSummary.inArrears != null || fromSummary.portfolioAtRiskPercent != null) {
      return fromSummary;
    }
  }

  const parByBranch = await tryRunReport('Portfolio at Risk by Branch', {
    R_officeId: String(officeId),
    R_parType: '1',
    genericResultSet: 'false'
  });
  if (parByBranch) {
    const fromParBranch = parseBranchLoanHealthFromReportRows(parByBranch, officeId);
    if (fromParBranch.portfolioAtRiskPercent != null || fromParBranch.inArrears != null) {
      return fromParBranch;
    }
  }

  const par = await tryRunReport('Portfolio at Risk', {
    R_parType: '1',
    genericResultSet: 'false'
  });
  return {
    inArrears: null,
    portfolioAtRiskPercent: par ? parsePortfolioAtRiskPercent(par) : null
  };
}

async function fetchDisbursedAmount(input: {
  officeId: number | null;
  startDate: string;
  endDate: string;
  currencyCode: string | null;
}): Promise<number | null> {
  if (input.officeId == null) {
    return null;
  }

  try {
    const params = buildReportRunQueryParams({
      officeId: String(input.officeId),
      startDate: input.startDate,
      endDate: input.endDate,
      fundId: '-1',
      currencyId: resolveDashboardReportCurrencyId(input.currencyCode)
    });
    const raw = await runReport('Funds Disbursed Between Dates Summary by Office', {
      ...params,
      genericResultSet: 'false'
    });
    return sumDisbursedAmountFromReportRows(raw);
  } catch {
    return null;
  }
}

async function fetchDisbursementTotals(input: {
  officeId: number | null;
  businessDate: string;
  currencyCode: string | null;
}): Promise<Pick<DashboardKpis['loans'], 'disbursedTodayAmount' | 'disbursedMonthAmount'>> {
  const endDate = toIsoDate(input.businessDate);
  const monthStart = monthStartIsoDate(input.businessDate);
  if (!endDate || !monthStart) {
    return { disbursedTodayAmount: null, disbursedMonthAmount: null };
  }

  const [disbursedTodayAmount, disbursedMonthAmount] = await Promise.all([
    fetchDisbursedAmount({
      officeId: input.officeId,
      startDate: endDate,
      endDate,
      currencyCode: input.currencyCode
    }),
    fetchDisbursedAmount({
      officeId: input.officeId,
      startDate: monthStart,
      endDate,
      currencyCode: input.currencyCode
    })
  ]);

  return { disbursedTodayAmount, disbursedMonthAmount };
}

async function fetchCashierKpi(
  session: ServerSession,
  currencyCode: string | null
): Promise<DashboardKpis['cashier']> {
  const balance = await loadCashierNavBalanceForSession(session);
  if (!balance || balance.balances.length === 0) {
    return null;
  }

  const scopedBalances = currencyCode
    ? balance.balances.filter((row) => row.currencyCode.toUpperCase() === currencyCode.toUpperCase())
    : balance.balances;

  if (scopedBalances.length === 0) {
    return null;
  }

  const label = formatCashierNavBalanceLabel({ ...balance, balances: scopedBalances });

  return {
    label,
    tellerId: balance.tellerId,
    cashierId: balance.cashierId,
    canOpenDetail: balance.canOpenCashierDetail
  };
}

export async function fetchDashboardKpis(
  options: DashboardKpiFetchOptions,
  session: ServerSession
): Promise<DashboardKpis> {
  const {
    officeId,
    currencyCode,
    businessDate,
    includeClients,
    includeLoans,
    includeSavings,
    includeReports,
    includeCollections,
    includeCheckerInbox,
    includeCashier
  } = options;

  const [
    customers,
    loanCounts,
    savingsTotal,
    loanHealth,
    disbursements,
    collections,
    checkerInboxPending,
    cashier
  ] = await Promise.all([
    includeClients ? fetchClientCounts(officeId) : Promise.resolve({ total: null, active: null }),
    includeLoans
      ? fetchLoanCounts()
      : Promise.resolve({ active: null, pendingApproval: null, pendingDisbursal: null }),
    includeSavings ? fetchSavingsCount() : Promise.resolve(null),
    includeLoans && includeReports
      ? fetchLoanHealthFromReports(officeId, currencyCode)
      : Promise.resolve({ inArrears: null, portfolioAtRiskPercent: null }),
    includeLoans && includeReports
      ? fetchDisbursementTotals({ officeId, businessDate, currencyCode })
      : Promise.resolve({ disbursedTodayAmount: null, disbursedMonthAmount: null }),
    includeCollections
      ? fetchExpectedCollectionsToday({
          officeId,
          transactionDate: businessDate,
          currencyCode
        })
      : Promise.resolve({ amount: null, loanCount: null }),
    includeCheckerInbox
      ? getCheckerInboxPendingCount().catch(() => null)
      : Promise.resolve(null),
    includeCashier ? fetchCashierKpi(session, currencyCode) : Promise.resolve(null)
  ]);

  return {
    officeId,
    currencyCode,
    businessDate,
    customers,
    loans: {
      ...loanCounts,
      ...loanHealth,
      disbursedTodayAmount: disbursements.disbursedTodayAmount,
      disbursedMonthAmount: disbursements.disbursedMonthAmount
    },
    collections: {
      expectedAmount: collections.amount,
      expectedLoanCount: collections.loanCount
    },
    savings: { total: savingsTotal },
    checkerInboxPending,
    cashier
  };
}
