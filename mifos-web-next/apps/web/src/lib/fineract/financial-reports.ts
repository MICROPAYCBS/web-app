/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * First-class financial statement reports (Fineract `report_name` is the stable contract).
 * Dedicated nav routes resolve by these exact names — never by tenant-specific report ids.
 *
 * Special treatment for these reports (layout, exports, etc.) will build on this registry.
 */
export const FINANCIAL_REPORT_SLUGS = [
  'balance-sheet',
  'income-statement',
  'trial-balance'
] as const;

export type FinancialReportSlug = (typeof FINANCIAL_REPORT_SLUGS)[number];

export type FinancialReportDefinition = {
  slug: FinancialReportSlug;
  /** Exact Fineract stretchy report name (`stretchy_report.report_name`). */
  reportName: string;
  /** Short nav / page label. */
  label: string;
  path: `/financial-reports/${FinancialReportSlug}`;
};

export const FINANCIAL_REPORTS: Record<FinancialReportSlug, FinancialReportDefinition> = {
  'balance-sheet': {
    slug: 'balance-sheet',
    reportName: 'Balance Sheet Table',
    label: 'Balance sheet',
    path: '/financial-reports/balance-sheet'
  },
  'income-statement': {
    slug: 'income-statement',
    reportName: 'Income Statement Table',
    label: 'Income statement',
    path: '/financial-reports/income-statement'
  },
  'trial-balance': {
    slug: 'trial-balance',
    reportName: 'Trial Balance Table',
    label: 'Trial balance',
    path: '/financial-reports/trial-balance'
  }
};

export function isFinancialReportSlug(value: string): value is FinancialReportSlug {
  return (FINANCIAL_REPORT_SLUGS as readonly string[]).includes(value);
}

export function getFinancialReportBySlug(
  slug: string
): FinancialReportDefinition | undefined {
  if (!isFinancialReportSlug(slug)) {
    return undefined;
  }
  return FINANCIAL_REPORTS[slug];
}
