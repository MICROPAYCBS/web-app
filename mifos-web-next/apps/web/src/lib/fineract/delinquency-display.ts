/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DelinquencyBucketApiType,
  DelinquencyBucketQueryType,
  DelinquencyRangeListItem,
  DelinquencyStringEnumOption
} from '@mifos/api-client';

export function formatDelinquencyEnumLabel(
  option?: { code?: string; value?: string; id?: string | number } | null
): string {
  if (!option) {
    return '—';
  }
  if (option.value) {
    return option.value;
  }
  if (option.code) {
    const segments = option.code.split('.');
    const label = segments[segments.length - 1] ?? option.code;
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }
  if (option.id !== undefined && option.id !== null) {
    return String(option.id);
  }
  return '—';
}

export function formatDelinquencyBucketType(
  bucketType?: { id?: string | number; code?: string; value?: string } | null
): string {
  const id = bucketType?.id;
  if (id === 'REGULAR' || id === 'regular') {
    return 'Regular';
  }
  if (id === 'WORKING_CAPITAL' || id === 'workingcapital') {
    return 'Working capital';
  }
  return formatDelinquencyEnumLabel(bucketType);
}

export function bucketTypeToQueryParam(
  bucketType?: { id?: string | number } | null
): DelinquencyBucketQueryType {
  const id = bucketType?.id;
  if (id === 'WORKING_CAPITAL' || id === 'workingcapital') {
    return 'workingcapital';
  }
  return 'regular';
}

export function queryParamToApiBucketType(
  bucketType: DelinquencyBucketQueryType
): DelinquencyBucketApiType {
  return bucketType === 'workingcapital' ? 'WORKING_CAPITAL' : 'REGULAR';
}

export function parseDelinquencyBucketQueryType(
  value: string | null | undefined
): DelinquencyBucketQueryType {
  return value === 'workingcapital' ? 'workingcapital' : 'regular';
}

export function sortDelinquencyRanges<T extends { minimumAgeDays?: number }>(ranges: T[]): T[] {
  return [...ranges].sort((left, right) => (left.minimumAgeDays ?? 0) - (right.minimumAgeDays ?? 0));
}

export function delinquencyRangeSelectOptions(ranges: DelinquencyRangeListItem[]) {
  return sortDelinquencyRanges(ranges).map((range) => ({
    value: String(range.id),
    label: range.classification ?? `Range #${range.id}`
  }));
}

export function delinquencyStringEnumSelectOptions(options: DelinquencyStringEnumOption[]) {
  return options.map((option) => ({
    value: String(option.id),
    label: formatDelinquencyEnumLabel(option)
  }));
}

export function formatDelinquencyDays(value?: number | null): string {
  return value !== undefined && value !== null ? String(value) : '—';
}
