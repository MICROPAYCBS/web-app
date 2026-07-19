/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ADVANCED_GL_ACCOUNT_ENQUIRY_PATH = '/accounting/gl-account-enquiry';

export type AdvancedGlAccountEnquiryStatus = 'enabled' | 'disabled' | '';

export type AdvancedGlAccountEnquirySearchFilters = {
  /** Leading digits of the GL code (e.g. account class / header prefix). */
  glPrefix: string;
  /** Full or partial ledger / GL code. */
  ledgerNumber: string;
  /** Branch office id. */
  officeId: string;
  /** ISO currency code (e.g. UGX). */
  currencyCode: string;
  /**
   * GL account enablement (`disabled` flag on the account).
   * Empty means any status.
   */
  status: AdvancedGlAccountEnquiryStatus;
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
  officeId: '',
  currencyCode: '',
  status: ''
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

export function parseAdvancedGlAccountEnquiryListQuery(
  params: Record<string, string | string[] | undefined>
): AdvancedGlAccountEnquiryListQuery {
  return {
    glPrefix: readParam(params, 'glPrefix') ?? '',
    ledgerNumber: readParam(params, 'ledgerNumber') ?? '',
    officeId: readParam(params, 'officeId') ?? '',
    currencyCode: (readParam(params, 'currencyCode') ?? '').toUpperCase(),
    status: parseStatus(readParam(params, 'status'))
  };
}

/** True when at least one optional filter is set. */
export function countActiveAdvancedGlAccountEnquiryFilters(
  filters: AdvancedGlAccountEnquirySearchFilters
): number {
  let count = 0;
  if (filters.glPrefix?.trim()) count += 1;
  if (filters.ledgerNumber?.trim()) count += 1;
  if (filters.officeId?.trim()) count += 1;
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
    filters.officeId ?? '',
    filters.currencyCode ?? '',
    filters.status ?? ''
  ].join('|');
}

export function advancedGlAccountEnquiryFiltersFromQuery(
  query: AdvancedGlAccountEnquiryListQuery
): AdvancedGlAccountEnquirySearchFilters {
  return {
    glPrefix: query.glPrefix ?? '',
    ledgerNumber: query.ledgerNumber ?? '',
    officeId: query.officeId ?? '',
    currencyCode: query.currencyCode ?? '',
    status: query.status ?? ''
  };
}

export function buildAdvancedGlAccountEnquiryUrl(
  filters: AdvancedGlAccountEnquirySearchFilters
): string {
  const params = new URLSearchParams();
  if (filters.glPrefix?.trim()) params.set('glPrefix', filters.glPrefix.trim());
  if (filters.ledgerNumber?.trim()) params.set('ledgerNumber', filters.ledgerNumber.trim());
  if (filters.officeId?.trim()) params.set('officeId', filters.officeId.trim());
  if (filters.currencyCode?.trim()) {
    params.set('currencyCode', filters.currencyCode.trim().toUpperCase());
  }
  if (filters.status === 'enabled' || filters.status === 'disabled') {
    params.set('status', filters.status);
  }
  const query = params.toString();
  return query
    ? `${ADVANCED_GL_ACCOUNT_ENQUIRY_PATH}?${query}`
    : ADVANCED_GL_ACCOUNT_ENQUIRY_PATH;
}

/**
 * Maps UI filters to `GET /glaccounts/enquiry` query params.
 * Returns `null` when no filter is set (API requires at least one).
 */
export function buildAdvancedGlAccountEnquiryApiParams(
  filters: AdvancedGlAccountEnquirySearchFilters
): Record<string, string> | null {
  if (!advancedGlAccountEnquiryHasActiveFilters(filters)) {
    return null;
  }
  const params: Record<string, string> = {};
  if (filters.glPrefix?.trim()) params.glPrefix = filters.glPrefix.trim();
  if (filters.ledgerNumber?.trim()) params.ledgerNumber = filters.ledgerNumber.trim();
  if (filters.officeId?.trim()) params.officeId = filters.officeId.trim();
  if (filters.currencyCode?.trim()) {
    params.currencyCode = filters.currencyCode.trim().toUpperCase();
  }
  if (filters.status === 'enabled') params.disabled = 'false';
  if (filters.status === 'disabled') params.disabled = 'true';
  return params;
}
