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

export function buildGlAccountEnquiryUrl(query: GlAccountEnquiryListQuery): string {
  const params = new URLSearchParams();
  const filters = glAccountEnquiryFiltersFromQuery(query);
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `/accounting/gl-account-enquiry?${qs}` : '/accounting/gl-account-enquiry';
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
