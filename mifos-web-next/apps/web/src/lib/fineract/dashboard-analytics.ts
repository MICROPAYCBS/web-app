import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DashboardAnalytics, DashboardTimescale } from '@/lib/dashboard/analytics-types';
import { resolveDashboardReportCurrencyId } from '@/lib/dashboard/dashboard-currency';
import {
  buildTrendSeries,
  extractAmountPair,
  getTrendReportName,
  normalizeDashboardReportRows
} from '@/lib/dashboard/analytics-parse';
import { runReport } from '@/lib/fineract/run-reports';

async function runDashboardReport(
  reportName: string,
  officeId: number,
  currencyCode: string | null
): Promise<Record<string, unknown>[]> {
  try {
    const raw = await runReport(reportName, {
      R_officeId: String(officeId),
      R_currencyId: resolveDashboardReportCurrencyId(currencyCode),
      genericResultSet: 'false'
    });
    return normalizeDashboardReportRows(raw);
  } catch {
    return [];
  }
}

export async function fetchDashboardAnalytics(
  officeId: number,
  timescale: DashboardTimescale,
  currencyCode: string | null = null
): Promise<DashboardAnalytics> {
  const [
    collectionRows,
    disbursementRows,
    clientTrendRows,
    loanTrendRows
  ] = await Promise.all([
    runDashboardReport('Demand Vs Collection', officeId, currencyCode),
    runDashboardReport('Disbursal Vs Awaitingdisbursal', officeId, currencyCode),
    runDashboardReport(getTrendReportName(timescale, 'client'), officeId, currencyCode),
    runDashboardReport(getTrendReportName(timescale, 'loan'), officeId, currencyCode)
  ]);

  const collectionBreakdown = extractAmountPair(collectionRows, 'Demand Vs Collection');
  const disbursementBreakdown = extractAmountPair(
    disbursementRows,
    'Disbursal Vs Awaitingdisbursal'
  );
  const trends = buildTrendSeries(timescale, clientTrendRows, loanTrendRows);

  return {
    amountCollected: collectionBreakdown.complete,
    amountDisbursed: disbursementBreakdown.complete,
    collectionBreakdown,
    disbursementBreakdown,
    trends
  };
}
