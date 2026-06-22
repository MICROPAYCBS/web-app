/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { format, isValid, parseISO } from 'date-fns';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';

export type CheckerInboxSearchFilters = {
  makerDateTimeFrom?: string;
  /** Legacy Fineract param name (lowercase "to"). */
  makerDateTimeto?: string;
  actionName?: string;
  entityName?: string;
  resourceId?: string;
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

export function parseCheckerInboxSearchFilters(
  params: Record<string, string | string[] | undefined>
): CheckerInboxSearchFilters {
  return {
    makerDateTimeFrom: readParam(params, 'makerDateTimeFrom'),
    makerDateTimeto: readParam(params, 'makerDateTimeto'),
    actionName: readParam(params, 'actionName'),
    entityName: readParam(params, 'entityName'),
    resourceId: readParam(params, 'resourceId')
  };
}

export function countActiveCheckerInboxFilters(filters: CheckerInboxSearchFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

export function buildCheckerInboxListUrl(filters: CheckerInboxSearchFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs
    ? `/checker-inbox-and-tasks/checker-inbox?${qs}`
    : '/checker-inbox-and-tasks/checker-inbox';
}

function formatCheckerInboxDateForApi(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = parseISO(value);
    if (isValid(parsed)) {
      return format(parsed, FINERACT_DATE_FORMAT);
    }
  }
  return value;
}

export function formatCheckerInboxFiltersForApi(
  filters: CheckerInboxSearchFilters
): CheckerInboxSearchFilters {
  return {
    ...filters,
    makerDateTimeFrom: formatCheckerInboxDateForApi(filters.makerDateTimeFrom),
    makerDateTimeto: formatCheckerInboxDateForApi(filters.makerDateTimeto)
  };
}

export function buildCheckerInboxSearchParams(
  filters: CheckerInboxSearchFilters
): Record<string, string> {
  const params: Record<string, string> = {};
  const apiFilters = formatCheckerInboxFiltersForApi(filters);
  for (const [key, value] of Object.entries(apiFilters)) {
    if (value) {
      params[key] = value;
    }
  }
  return params;
}
