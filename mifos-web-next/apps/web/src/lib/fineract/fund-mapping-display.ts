/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FundMappingSearchResultItem } from '@mifos/api-client';
import { formatAmount, toDecimal } from '@mifos/domain';

export const FUND_MAPPING_LOAN_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed (obligations met)' },
  { value: 'overpaid', label: 'Overpaid' },
  { value: 'writeoff', label: 'Closed (written-off)' }
] as const;

export const FUND_MAPPING_LOAN_DATE_OPTIONS = [
  { value: 'approvalDate', label: 'Approval date' },
  { value: 'createdDate', label: 'Creation date' },
  { value: 'disbursalDate', label: 'Disbursement date' }
] as const;

export const FUND_MAPPING_COMPARISON_CONDITIONS = [
  { value: 'between', label: 'Between' },
  { value: '<=', label: '≤' },
  { value: '>=', label: '≥' },
  { value: '<', label: '<' },
  { value: '>', label: '>' },
  { value: '=', label: '=' }
] as const;

export type FundMappingComparisonCondition =
  (typeof FUND_MAPPING_COMPARISON_CONDITIONS)[number]['value'];

export function formatFundMappingOutstanding(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  const decimal = toDecimal(value);
  if (!decimal) {
    return '—';
  }
  return formatAmount(decimal);
}

export function formatFundMappingPercentage(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${value}%`;
}

export function formatFundMappingCount(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return String(value);
}

export function fundMappingResultKey(item: FundMappingSearchResultItem, index: number): string {
  return [
    item.officeName ?? 'office',
    item.loanProductName ?? 'product',
    item.count ?? index,
    index
  ].join('-');
}
