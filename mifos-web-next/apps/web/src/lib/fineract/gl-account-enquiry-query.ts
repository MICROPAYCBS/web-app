/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toFineractDate } from '@/lib/fineract/dates';
import {
  buildReportRunQueryParams,
  formatReportRunDateValue
} from '@/lib/fineract/report-run-display';
import { REPORT_PARAMETER_SELECT_ALL_VALUE } from '@mifos/domain';

/** Stretchy table report powered by m_gl_balance_snapshot + period journal lines. */
export const GL_ACCOUNT_ENQUIRY_REPORT_NAME = 'GeneralLedgerReport Table';

export type GlAccountDetailTab = 'summary' | 'history';

export type GlAccountEnquirySearchFilters = {
  glAccountId: string;
  /** Required ISO currency code (e.g. UGX). */
  currencyCode: string;
  /** Required branch — report scopes by office hierarchy. */
  officeId: string;
  /** Optional department filter; empty means all departments. */
  departmentId?: string;
  fromDate?: string;
  toDate?: string;
};

export type GlAccountEnquiryListQuery = GlAccountEnquirySearchFilters;

export type GlAccountEnquiryLine = {
  entryDate: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  openingBalance: number;
  source: string;
  transactionId: string;
  cumulativeSum: number;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function resolveDefaultFilterDate(defaultTransactionDate?: string) {
  if (defaultTransactionDate?.trim()) {
    return defaultTransactionDate.trim();
  }
  return toFineractDate(new Date());
}

export function parseGlAccountDetailTab(
  params: Record<string, string | string[] | undefined>
): GlAccountDetailTab {
  return readParam(params, 'tab') === 'history' ? 'history' : 'summary';
}

export function parseGlAccountEnquiryListQuery(
  params: Record<string, string | string[] | undefined>,
  options?: {
    defaultTransactionDate?: string;
    defaultCurrencyCode?: string;
    defaultOfficeId?: string;
  }
): GlAccountEnquiryListQuery {
  const defaultDate = resolveDefaultFilterDate(options?.defaultTransactionDate);
  const defaultCurrency = options?.defaultCurrencyCode?.trim().toUpperCase() ?? '';
  const defaultOffice = options?.defaultOfficeId?.trim() ?? '';

  return {
    glAccountId: readParam(params, 'glAccountId') ?? '',
    currencyCode: (readParam(params, 'currencyCode') ?? defaultCurrency).toUpperCase(),
    officeId: readParam(params, 'officeId') ?? defaultOffice,
    departmentId: readParam(params, 'departmentId'),
    fromDate: readParam(params, 'fromDate') ?? defaultDate,
    toDate: readParam(params, 'toDate') ?? defaultDate
  };
}

/**
 * History tab on GL account detail — account comes from the path.
 * Branch/currency are not defaulted (empty = choose filters); dates default to business date.
 */
export function parseGlAccountHistoryQuery(
  params: Record<string, string | string[] | undefined>,
  glAccountId: string | number,
  options?: { defaultTransactionDate?: string }
): GlAccountEnquiryListQuery {
  const defaultDate = resolveDefaultFilterDate(options?.defaultTransactionDate);
  return {
    glAccountId: String(glAccountId),
    currencyCode: (readParam(params, 'currencyCode') ?? '').toUpperCase(),
    officeId: readParam(params, 'officeId') ?? '',
    departmentId: readParam(params, 'departmentId'),
    fromDate: readParam(params, 'fromDate') ?? defaultDate,
    toDate: readParam(params, 'toDate') ?? defaultDate
  };
}

export function glAccountEnquiryHasRequiredAccount(query: GlAccountEnquiryListQuery): boolean {
  const id = Number(query.glAccountId);
  return Number.isFinite(id) && id > 0;
}

export function glAccountEnquiryHasRequiredFilters(query: GlAccountEnquiryListQuery): boolean {
  const officeId = Number(query.officeId);
  return (
    glAccountEnquiryHasRequiredAccount(query) &&
    Boolean(query.currencyCode?.trim()) &&
    Number.isFinite(officeId) &&
    officeId > 0 &&
    Boolean(query.fromDate?.trim()) &&
    Boolean(query.toDate?.trim())
  );
}

export function glAccountEnquiryFiltersFromQuery(
  query: GlAccountEnquiryListQuery
): GlAccountEnquirySearchFilters {
  return {
    glAccountId: query.glAccountId,
    currencyCode: query.currencyCode,
    officeId: query.officeId,
    departmentId: query.departmentId,
    fromDate: query.fromDate,
    toDate: query.toDate
  };
}

export function countActiveGlAccountEnquiryFilters(
  filters: GlAccountEnquirySearchFilters
): number {
  let count = 0;
  if (filters.glAccountId?.trim()) count += 1;
  if (filters.currencyCode?.trim()) count += 1;
  if (filters.officeId?.trim()) count += 1;
  if (filters.departmentId?.trim()) count += 1;
  if (filters.fromDate?.trim()) count += 1;
  if (filters.toDate?.trim()) count += 1;
  return count;
}

/** Active History filters excluding the locked GL account. */
export function countActiveGlAccountHistoryFilters(
  filters: GlAccountEnquirySearchFilters
): number {
  let count = 0;
  if (filters.currencyCode?.trim()) count += 1;
  if (filters.officeId?.trim()) count += 1;
  if (filters.departmentId?.trim()) count += 1;
  if (filters.fromDate?.trim()) count += 1;
  if (filters.toDate?.trim()) count += 1;
  return count;
}

export function glAccountEnquiryFiltersSignature(filters: GlAccountEnquirySearchFilters): string {
  return JSON.stringify({
    glAccountId: filters.glAccountId ?? '',
    currencyCode: filters.currencyCode ?? '',
    officeId: filters.officeId ?? '',
    departmentId: filters.departmentId ?? '',
    fromDate: filters.fromDate ?? '',
    toDate: filters.toDate ?? ''
  });
}

/** Maps legacy enquiry URLs to the History tab on chart-of-accounts detail. */
export function buildGlAccountEnquiryUrl(query: GlAccountEnquiryListQuery): string {
  if (!glAccountEnquiryHasRequiredAccount(query)) {
    return '/accounting/chart-of-accounts';
  }
  return buildGlAccountHistoryUrl(query.glAccountId, query);
}

const GL_ACCOUNT_ENQUIRY_RETURN_PREFIX = '/accounting/gl-account-enquiry';

/** Only allow return links back to GL account enquiry (blocks open redirects). */
export function parseGlAccountDetailReturnTo(
  params: Record<string, string | string[] | undefined>
): string | null {
  const raw = readParam(params, 'returnTo');
  if (!raw) {
    return null;
  }
  if (!raw.startsWith(GL_ACCOUNT_ENQUIRY_RETURN_PREFIX)) {
    return null;
  }
  if (raw.includes('://') || raw.startsWith('//') || raw.includes('\\')) {
    return null;
  }
  return raw;
}

export type GlAccountDetailNavOptions = {
  returnTo?: string | null;
};

function withReturnToParam(params: URLSearchParams, returnTo?: string | null): void {
  if (!returnTo) {
    return;
  }
  if (
    !returnTo.startsWith(GL_ACCOUNT_ENQUIRY_RETURN_PREFIX) ||
    returnTo.includes('://') ||
    returnTo.startsWith('//')
  ) {
    return;
  }
  params.set('returnTo', returnTo);
}

/** History tab URL on chart-of-accounts detail. */
export function buildGlAccountHistoryUrl(
  glAccountId: string | number,
  filters: Pick<
    GlAccountEnquirySearchFilters,
    'officeId' | 'currencyCode' | 'departmentId' | 'fromDate' | 'toDate'
  >,
  options?: GlAccountDetailNavOptions
): string {
  const params = new URLSearchParams();
  params.set('tab', 'history');
  if (filters.officeId?.trim()) params.set('officeId', filters.officeId.trim());
  if (filters.currencyCode?.trim()) {
    params.set('currencyCode', filters.currencyCode.trim().toUpperCase());
  }
  if (filters.departmentId?.trim()) params.set('departmentId', filters.departmentId.trim());
  if (filters.fromDate?.trim()) params.set('fromDate', filters.fromDate.trim());
  if (filters.toDate?.trim()) params.set('toDate', filters.toDate.trim());
  withReturnToParam(params, options?.returnTo);
  return `/accounting/chart-of-accounts/${glAccountId}?${params.toString()}`;
}

export function buildGlAccountSummaryUrl(
  glAccountId: string | number,
  options?: GlAccountDetailNavOptions
): string {
  const params = new URLSearchParams();
  withReturnToParam(params, options?.returnTo);
  const qs = params.toString();
  return qs
    ? `/accounting/chart-of-accounts/${glAccountId}?${qs}`
    : `/accounting/chart-of-accounts/${glAccountId}`;
}

export function buildGlAccountDetailTabUrl(
  glAccountId: string | number,
  tab: GlAccountDetailTab,
  filters?: Pick<
    GlAccountEnquirySearchFilters,
    'officeId' | 'currencyCode' | 'departmentId' | 'fromDate' | 'toDate'
  >,
  options?: GlAccountDetailNavOptions
): string {
  if (tab === 'history') {
    return buildGlAccountHistoryUrl(
      glAccountId,
      {
        officeId: filters?.officeId ?? '',
        currencyCode: filters?.currencyCode ?? '',
        departmentId: filters?.departmentId,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate
      },
      options
    );
  }
  const params = new URLSearchParams();
  if (filters?.officeId?.trim()) params.set('officeId', filters.officeId.trim());
  if (filters?.currencyCode?.trim()) {
    params.set('currencyCode', filters.currencyCode.trim().toUpperCase());
  }
  if (filters?.departmentId?.trim()) params.set('departmentId', filters.departmentId.trim());
  if (filters?.fromDate?.trim()) params.set('fromDate', filters.fromDate.trim());
  if (filters?.toDate?.trim()) params.set('toDate', filters.toDate.trim());
  withReturnToParam(params, options?.returnTo);
  const qs = params.toString();
  return qs
    ? `/accounting/chart-of-accounts/${glAccountId}?${qs}`
    : `/accounting/chart-of-accounts/${glAccountId}`;
}

/** Query params for `GET /runreports/GeneralLedgerReport Table`. */
export function buildGlAccountEnquiryReportParams(
  query: GlAccountEnquiryListQuery
): Record<string, string> {
  return buildReportRunQueryParams({
    officeId: query.officeId,
    GLAccountNO: query.glAccountId,
    currencyId: query.currencyCode.trim().toUpperCase(),
    departmentId: query.departmentId?.trim() || REPORT_PARAMETER_SELECT_ALL_VALUE,
    startDate: formatReportRunDateValue(query.fromDate ?? ''),
    endDate: formatReportRunDateValue(query.toDate ?? '')
  });
}
