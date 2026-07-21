/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseGlAccountEnquiryPrefix } from '@/lib/fineract/parse-gl-account-enquiry-prefix';

export const ADVANCED_GL_ACCOUNT_ENQUIRY_PATH = '/accounting/gl-account-enquiry';

export type AdvancedGlAccountEnquiryStatus = 'enabled' | 'disabled' | '';

export type AdvancedGlAccountEnquirySearchFilters = {
  /**
   * Branch–department prefix (e.g. `01` then `01-02`).
   * UI-only: first two digits prefill Branch; further digits prefill Department.
   * Never sent on the enquiry URL or API.
   */
  glPrefix: string;
  /** Full or partial ledger / GL code. */
  ledgerNumber: string;
  /**
   * Free-text match against GL account name or description (contains, case-insensitive).
   * Sent as `description` on the enquiry URL and API.
   */
  description: string;
  /** Branch office id (also filled from the first two prefix digits). */
  officeId: string;
  /** Department id (also filled from digits after the branch segment). */
  departmentId: string;
  /** ISO currency code (e.g. UGX). */
  currencyCode: string;
  /**
   * GL account enablement (`disabled` flag on the account).
   * Empty means any status.
   */
  status: AdvancedGlAccountEnquiryStatus;
  /**
   * When true (default), omit accounts whose enquiry balance is exactly zero.
   * When false, include zero-balance accounts that match the other filters.
   * Sent as `excludeZeroBalance` on the enquiry URL and API whenever a search runs.
   * Does not count as a standalone search criterion.
   */
  excludeZeroBalance: boolean;
};

export type AdvancedGlAccountEnquiryListQuery = AdvancedGlAccountEnquirySearchFilters;

/** Matches chart-of-accounts Status column: Enabled / Disabled. */
export const ADVANCED_GL_ACCOUNT_ENQUIRY_STATUS_OPTIONS: Array<{
  value: Exclude<AdvancedGlAccountEnquiryStatus, ''>;
  label: string;
}> = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' }
];

export const EMPTY_ADVANCED_GL_ACCOUNT_ENQUIRY_FILTERS: AdvancedGlAccountEnquirySearchFilters = {
  glPrefix: '',
  ledgerNumber: '',
  description: '',
  officeId: '',
  departmentId: '',
  currencyCode: '',
  status: '',
  excludeZeroBalance: true
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

function parseStatus(value: string | undefined): AdvancedGlAccountEnquiryStatus {
  if (value === 'enabled' || value === 'disabled') {
    return value;
  }
  return '';
}

/** Default is exclude (`true`). Only `false` opts in to zero-balance rows. */
function parseExcludeZeroBalance(value: string | undefined): boolean {
  return value !== 'false';
}

/**
 * Parse shareable enquiry URL params.
 * Legacy `glPrefix` is expanded into office/department ids and never kept on the query.
 */
export function parseAdvancedGlAccountEnquiryListQuery(
  params: Record<string, string | string[] | undefined>
): AdvancedGlAccountEnquiryListQuery {
  const fromLegacyPrefix = parseGlAccountEnquiryPrefix(readParam(params, 'glPrefix'));
  const officeId =
    readParam(params, 'officeId') ??
    (fromLegacyPrefix.officeId != null ? String(fromLegacyPrefix.officeId) : '');
  const departmentId =
    readParam(params, 'departmentId') ??
    (fromLegacyPrefix.departmentId != null ? String(fromLegacyPrefix.departmentId) : '');

  return {
    glPrefix: '',
    ledgerNumber: readParam(params, 'ledgerNumber') ?? '',
    description: readParam(params, 'description') ?? '',
    officeId,
    departmentId,
    currencyCode: (readParam(params, 'currencyCode') ?? '').toUpperCase(),
    status: parseStatus(readParam(params, 'status')),
    excludeZeroBalance: parseExcludeZeroBalance(readParam(params, 'excludeZeroBalance'))
  };
}

/**
 * Counts filters that become enquiry API search criteria (not the UI-only prefix,
 * and not the exclude-zero-balance result modifier).
 * Call after {@link prefillFiltersFromGlAccountEnquiryPrefix} when validating Search.
 */
export function countActiveAdvancedGlAccountEnquiryFilters(
  filters: AdvancedGlAccountEnquirySearchFilters
): number {
  let count = 0;
  if (filters.ledgerNumber?.trim()) count += 1;
  if (filters.description?.trim()) count += 1;
  if (filters.officeId?.trim()) count += 1;
  if (filters.departmentId?.trim()) count += 1;
  if (filters.currencyCode?.trim()) count += 1;
  if (filters.status === 'enabled' || filters.status === 'disabled') count += 1;
  return count;
}

export function advancedGlAccountEnquiryHasActiveFilters(
  query: AdvancedGlAccountEnquiryListQuery
): boolean {
  return countActiveAdvancedGlAccountEnquiryFilters(query) > 0;
}

/** @deprecated Prefer {@link advancedGlAccountEnquiryHasActiveFilters}. */
export function advancedGlAccountEnquiryHasRequiredFilters(
  query: AdvancedGlAccountEnquiryListQuery
): boolean {
  return advancedGlAccountEnquiryHasActiveFilters(query);
}

export function advancedGlAccountEnquiryFiltersSignature(
  filters: AdvancedGlAccountEnquirySearchFilters
): string {
  return [
    filters.glPrefix ?? '',
    filters.ledgerNumber ?? '',
    filters.description ?? '',
    filters.officeId ?? '',
    filters.departmentId ?? '',
    filters.currencyCode ?? '',
    filters.status ?? '',
    filters.excludeZeroBalance === false ? '0' : '1'
  ].join('|');
}

export function advancedGlAccountEnquiryFiltersFromQuery(
  query: AdvancedGlAccountEnquiryListQuery
): AdvancedGlAccountEnquirySearchFilters {
  return {
    glPrefix: query.glPrefix ?? '',
    ledgerNumber: query.ledgerNumber ?? '',
    description: query.description ?? '',
    officeId: query.officeId ?? '',
    departmentId: query.departmentId ?? '',
    currencyCode: query.currencyCode ?? '',
    status: query.status ?? '',
    excludeZeroBalance: query.excludeZeroBalance !== false
  };
}

/** Shareable enquiry URL — never includes UI-only `glPrefix`. */
export function buildAdvancedGlAccountEnquiryUrl(
  filters: AdvancedGlAccountEnquirySearchFilters
): string {
  const params = new URLSearchParams();
  if (filters.ledgerNumber?.trim()) params.set('ledgerNumber', filters.ledgerNumber.trim());
  if (filters.description?.trim()) params.set('description', filters.description.trim());
  if (filters.officeId?.trim()) params.set('officeId', filters.officeId.trim());
  if (filters.departmentId?.trim()) params.set('departmentId', filters.departmentId.trim());
  if (filters.currencyCode?.trim()) {
    params.set('currencyCode', filters.currencyCode.trim().toUpperCase());
  }
  if (filters.status === 'enabled' || filters.status === 'disabled') {
    params.set('status', filters.status);
  }
  // Only persist the non-default opt-in; omit when excluding (default).
  if (filters.excludeZeroBalance === false) {
    params.set('excludeZeroBalance', 'false');
  }
  const query = params.toString();
  return query
    ? `${ADVANCED_GL_ACCOUNT_ENQUIRY_PATH}?${query}`
    : ADVANCED_GL_ACCOUNT_ENQUIRY_PATH;
}

/**
 * Maps UI filters to `GET /glaccounts/enquiry` query params.
 * Never sends `glPrefix`. Returns `null` when no search criterion is set
 * (`excludeZeroBalance` alone is not enough).
 */
export function buildAdvancedGlAccountEnquiryApiParams(
  filters: AdvancedGlAccountEnquirySearchFilters
): Record<string, string> | null {
  const officeId = filters.officeId?.trim() || '';
  const departmentId = filters.departmentId?.trim() || '';

  const params: Record<string, string> = {};
  if (filters.ledgerNumber?.trim()) params.ledgerNumber = filters.ledgerNumber.trim();
  if (filters.description?.trim()) params.description = filters.description.trim();
  if (officeId) params.officeId = officeId;
  if (departmentId) params.departmentId = departmentId;
  if (filters.currencyCode?.trim()) {
    params.currencyCode = filters.currencyCode.trim().toUpperCase();
  }
  if (filters.status === 'enabled') params.disabled = 'false';
  if (filters.status === 'disabled') params.disabled = 'true';

  if (Object.keys(params).length === 0) {
    return null;
  }

  params.excludeZeroBalance = filters.excludeZeroBalance === false ? 'false' : 'true';
  return params;
}
