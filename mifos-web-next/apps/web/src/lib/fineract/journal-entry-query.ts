/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';

export const JOURNAL_ENTRIES_DEFAULT_LIMIT = 50;

export type JournalEntrySearchFilters = {
  officeId?: string;
  glAccountId?: string;
  departmentId?: string;
  manualEntriesOnly?: string;
  transactionId?: string;
  fromDate?: string;
  toDate?: string;
  submittedOnDateFrom?: string;
  submittedOnDateTo?: string;
  dateFormat: string;
  locale: string;
};

export type JournalEntryListQuery = JournalEntrySearchFilters & {
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

export function parseJournalEntryListQuery(
  params: Record<string, string | string[] | undefined>,
  defaultTransactionDate?: string
): JournalEntryListQuery {
  const defaultDate = resolveDefaultFilterDate(defaultTransactionDate);
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(
    1,
    Number(readParam(params, 'limit') ?? String(JOURNAL_ENTRIES_DEFAULT_LIMIT)) ||
      JOURNAL_ENTRIES_DEFAULT_LIMIT
  );

  return {
    offset: pageIndex * limit,
    limit,
    orderBy: readParam(params, 'orderBy') ?? '',
    sortOrder: readParam(params, 'sortOrder') ?? '',
    officeId: readParam(params, 'officeId'),
    glAccountId: readParam(params, 'glAccountId'),
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

export function journalEntryOrderByForApi(orderBy: string) {
  if (orderBy === 'debit' || orderBy === 'credit') {
    return 'amount';
  }
  return orderBy;
}

export function journalEntryFiltersFromQuery(
  query: JournalEntryListQuery
): JournalEntrySearchFilters {
  return {
    officeId: query.officeId,
    glAccountId: query.glAccountId,
    departmentId: query.departmentId,
    manualEntriesOnly: query.manualEntriesOnly,
    transactionId: query.transactionId,
    fromDate: query.fromDate,
    toDate: query.toDate,
    submittedOnDateFrom: query.submittedOnDateFrom,
    submittedOnDateTo: query.submittedOnDateTo,
    dateFormat: query.dateFormat,
    locale: query.locale
  };
}

export function buildJournalEntrySearchParams(query: JournalEntryListQuery): Record<string, string> {
  const params: Record<string, string> = {
    offset: String(query.offset),
    limit: String(query.limit),
    sortOrder: query.sortOrder,
    orderBy: journalEntryOrderByForApi(query.orderBy),
    dateFormat: query.dateFormat,
    locale: query.locale,
    fromDate: query.fromDate ?? toFineractDate(new Date()),
    toDate: query.toDate ?? toFineractDate(new Date())
  };

  if (query.officeId) {
    params.officeId = query.officeId;
  }
  if (query.glAccountId) {
    params.glAccountId = query.glAccountId;
  }
  if (query.departmentId) {
    params.departmentId = query.departmentId;
  }
  if (query.manualEntriesOnly) {
    params.manualEntriesOnly = query.manualEntriesOnly;
  }
  if (query.transactionId) {
    params.transactionId = query.transactionId;
  }
  if (query.submittedOnDateFrom) {
    params.submittedOnDateFrom = query.submittedOnDateFrom;
  }
  if (query.submittedOnDateTo) {
    params.submittedOnDateTo = query.submittedOnDateTo;
  }

  return params;
}

export function countActiveJournalEntryFilters(filters: JournalEntrySearchFilters): number {
  let count = 0;
  if (filters.officeId) {
    count += 1;
  }
  if (filters.glAccountId) {
    count += 1;
  }
  if (filters.departmentId) {
    count += 1;
  }
  if (filters.manualEntriesOnly) {
    count += 1;
  }
  if (filters.transactionId?.trim()) {
    count += 1;
  }
  if (filters.submittedOnDateFrom) {
    count += 1;
  }
  if (filters.submittedOnDateTo) {
    count += 1;
  }
  return count;
}

export function journalEntryFiltersSignature(filters: JournalEntrySearchFilters): string {
  return JSON.stringify({
    officeId: filters.officeId ?? '',
    glAccountId: filters.glAccountId ?? '',
    departmentId: filters.departmentId ?? '',
    manualEntriesOnly: filters.manualEntriesOnly ?? '',
    transactionId: filters.transactionId ?? '',
    fromDate: filters.fromDate ?? '',
    toDate: filters.toDate ?? '',
    submittedOnDateFrom: filters.submittedOnDateFrom ?? '',
    submittedOnDateTo: filters.submittedOnDateTo ?? ''
  });
}

export function buildJournalEntriesUrl(query: JournalEntryListQuery): string {
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit);
  if (page > 0) {
    params.set('page', String(page));
  }
  if (query.limit !== JOURNAL_ENTRIES_DEFAULT_LIMIT) {
    params.set('limit', String(query.limit));
  }
  if (query.orderBy) {
    params.set('orderBy', query.orderBy);
  }
  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }

  const filters = journalEntryFiltersFromQuery(query);
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'dateFormat' || key === 'locale') {
      continue;
    }
    if (value) {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `/accounting/journal-entries?${qs}` : '/accounting/journal-entries';
}
