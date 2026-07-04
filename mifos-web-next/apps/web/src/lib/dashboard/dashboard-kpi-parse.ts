/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { normalizeDashboardReportRows } from '@/lib/dashboard/analytics-parse';
import type { DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';

function readNumericField(row: Record<string, unknown>, keys: string[]): number | null {
  for (const [column, value] of Object.entries(row)) {
    const normalized = column.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!keys.some((key) => normalized.includes(key.replace(/[^a-z0-9]/g, '')))) {
      continue;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

/** Extract branch-level loan health metrics from Fineract stretchy reports. */
export function parseBranchLoanHealthFromReportRows(
  rows: unknown,
  officeId: number
): Pick<DashboardKpis['loans'], 'inArrears' | 'portfolioAtRiskPercent'> {
  const normalized = normalizeDashboardReportRows(rows);
  if (normalized.length === 0) {
    return { inArrears: null, portfolioAtRiskPercent: null };
  }

  const officeRow =
    normalized.find((row) => {
      const branchId = Number(row.officeId ?? row.office_id ?? row.branchId);
      if (Number.isFinite(branchId) && branchId === officeId) {
        return true;
      }
      const branchName = String(row['Office/Branch'] ?? row.officeName ?? row.branch ?? '').trim();
      return !branchName;
    }) ?? normalized[0];

  const inArrears =
    readNumericField(officeRow, ['loansinarrears', 'loans_in_arrears', 'arrearsloancount']) ??
    readNumericField(officeRow, ['noofloansinarrears']);

  const portfolioAtRiskPercent =
    readNumericField(officeRow, ['portfolioatriskpc', 'par', 'portfolioatrisk']) ??
    readNumericField(officeRow, ['portfolio at risk']);

  return {
    inArrears: inArrears != null ? Math.max(0, Math.round(inArrears)) : null,
    portfolioAtRiskPercent:
      portfolioAtRiskPercent != null ? Math.max(0, portfolioAtRiskPercent) : null
  };
}

export function parseActiveLoansSummaryHealth(
  rows: unknown
): Pick<DashboardKpis['loans'], 'inArrears' | 'portfolioAtRiskPercent'> {
  const normalized = normalizeDashboardReportRows(rows);
  if (normalized.length === 0) {
    return { inArrears: null, portfolioAtRiskPercent: null };
  }

  let inArrearsTotal = 0;
  let foundArrears = false;
  let portfolioAtRiskPercent: number | null = null;

  for (const row of normalized) {
    const arrears =
      readNumericField(row, ['noofloansinarrears', 'loansinarrears']) ??
      readNumericField(row, ['no of loans in arrears']);
    if (arrears != null) {
      inArrearsTotal += arrears;
      foundArrears = true;
    }

    const par =
      readNumericField(row, ['portfolioatrisk']) ??
      readNumericField(row, ['portfolio at risk']);
    if (par != null && portfolioAtRiskPercent == null) {
      portfolioAtRiskPercent = Math.max(0, par);
    }
  }

  return {
    inArrears: foundArrears ? Math.max(0, Math.round(inArrearsTotal)) : null,
    portfolioAtRiskPercent
  };
}

export function parsePortfolioAtRiskPercent(rows: unknown): number | null {
  const normalized = normalizeDashboardReportRows(rows);
  const first = normalized[0];
  if (!first) {
    return null;
  }
  const value =
    readNumericField(first, ['portfolioatrisk', 'par']) ??
    readNumericField(first, ['portfolio at risk']);
  return value != null ? Math.max(0, value) : null;
}

export function sumDisbursedAmountFromReportRows(rows: unknown): number | null {
  const normalized = normalizeDashboardReportRows(rows);
  if (normalized.length === 0) {
    return null;
  }

  let total = 0;
  let found = false;
  for (const row of normalized) {
    const amount = readNumericField(row, ['disbursedamount', 'disbursed_amount']);
    if (amount != null) {
      total += amount;
      found = true;
    }
  }

  return found ? total : null;
}
