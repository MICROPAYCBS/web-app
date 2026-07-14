/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  buildJournalEntrySearchParams,
  countActiveJournalEntryFilters,
  journalEntryFiltersFromQuery,
  journalEntryFiltersSignature,
  journalEntryOrderByForApi,
  JOURNAL_ENTRIES_DEFAULT_LIMIT,
  type JournalEntrySearchFilters
} from '@/lib/fineract/journal-entry-query';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';

export const GL_ACCOUNT_ENQUIRY_DEFAULT_LIMIT = 50;
export const GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY = 'transactionDate';
/** List shows the latest matching entry first. */
export const GL_ACCOUNT_ENQUIRY_DEFAULT_SORT_ORDER = 'desc';
export const GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT = 10_000;
/** Summary totals walk the period oldest→newest (independent of list sort). */
const GL_ACCOUNT_ENQUIRY_SUMMARY_SORT_ORDER = 'asc';

export type GlAccountEnquirySearchFilters = JournalEntrySearchFilters & {
  glAccountId: string;
  /** Required ISO currency code for the enquiry (e.g. UGX). */
  currencyCode: string;
};

export type GlAccountEnquiryListQuery = GlAccountEnquirySearchFilters & {
  offset: number;
  limit: number;
  orderBy: string;
  sortOrder: string;
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
  }
): GlAccountEnquiryListQuery {
  const defaultDate = resolveDefaultFilterDate(options?.defaultTransactionDate);
  const defaultCurrency = options?.defaultCurrencyCode?.trim().toUpperCase() ?? '';
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(
    1,
    Number(readParam(params, 'limit') ?? String(GL_ACCOUNT_ENQUIRY_DEFAULT_LIMIT)) ||
      GL_ACCOUNT_ENQUIRY_DEFAULT_LIMIT
  );

  return {
    offset: pageIndex * limit,
    limit,
    orderBy: readParam(params, 'orderBy') ?? GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY,
    sortOrder: readParam(params, 'sortOrder') ?? GL_ACCOUNT_ENQUIRY_DEFAULT_SORT_ORDER,
    glAccountId: readParam(params, 'glAccountId') ?? '',
    currencyCode: (readParam(params, 'currencyCode') ?? defaultCurrency).toUpperCase(),
    officeId: readParam(params, 'officeId'),
    departmentId: readParam(params, 'departmentId'),
    manualEntriesOnly: readParam(params, 'manualEntriesOnly'),
    transactionId: readParam(params, 'transactionId'),
    fromDate: readParam(params, 'fromDate') ?? defaultDate,
    toDate: readParam(params, 'toDate') ?? defaultDate,
    submittedOnDateFrom: readParam(params, 'submittedOnDateFrom'),
    submittedOnDateTo: readParam(params, 'submittedOnDateTo'),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function glAccountEnquiryHasRequiredAccount(query: GlAccountEnquiryListQuery): boolean {
  const id = Number(query.glAccountId);
  return Number.isFinite(id) && id > 0;
}

export function glAccountEnquiryHasRequiredFilters(query: GlAccountEnquiryListQuery): boolean {
  return glAccountEnquiryHasRequiredAccount(query) && Boolean(query.currencyCode?.trim());
}

export function glAccountEnquiryFiltersFromQuery(
  query: GlAccountEnquiryListQuery
): GlAccountEnquirySearchFilters {
  return {
    ...journalEntryFiltersFromQuery(query),
    glAccountId: query.glAccountId,
    currencyCode: query.currencyCode
  };
}

export function countActiveGlAccountEnquiryFilters(
  filters: GlAccountEnquirySearchFilters
): number {
  let count = countActiveJournalEntryFilters(filters);
  if (filters.currencyCode?.trim()) {
    count += 1;
  }
  return count;
}

export function glAccountEnquiryFiltersSignature(filters: GlAccountEnquirySearchFilters): string {
  return JSON.stringify({
    ...JSON.parse(journalEntryFiltersSignature(filters)),
    currencyCode: filters.currencyCode ?? ''
  });
}

export function buildGlAccountEnquirySearchParams(
  query: GlAccountEnquiryListQuery,
  options: { runningBalance?: boolean; summaryFetch?: boolean } = {}
): Record<string, string> {
  const params = buildJournalEntrySearchParams(query);

  if (query.currencyCode?.trim()) {
    params.currencyCode = query.currencyCode.trim().toUpperCase();
  }

  if (options.runningBalance) {
    params.runningBalance = 'true';
  }

  if (options.summaryFetch) {
    params.offset = '0';
    params.limit = String(GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT);
    params.orderBy = journalEntryOrderByForApi(
      GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY,
      GL_ACCOUNT_ENQUIRY_SUMMARY_SORT_ORDER
    );
    params.sortOrder = GL_ACCOUNT_ENQUIRY_SUMMARY_SORT_ORDER;
  }

  return params;
}

export function buildGlAccountEnquiryUrl(query: GlAccountEnquiryListQuery): string {
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit);
  if (page > 0) {
    params.set('page', String(page));
  }
  if (query.limit !== GL_ACCOUNT_ENQUIRY_DEFAULT_LIMIT) {
    params.set('limit', String(query.limit));
  }
  if (query.orderBy && query.orderBy !== GL_ACCOUNT_ENQUIRY_DEFAULT_ORDER_BY) {
    params.set('orderBy', query.orderBy);
  }
  if (query.sortOrder && query.sortOrder !== GL_ACCOUNT_ENQUIRY_DEFAULT_SORT_ORDER) {
    params.set('sortOrder', query.sortOrder);
  }

  const filters = glAccountEnquiryFiltersFromQuery(query);
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'dateFormat' || key === 'locale') {
      continue;
    }
    if (value) {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `/accounting/gl-account-enquiry?${qs}` : '/accounting/gl-account-enquiry';
}
