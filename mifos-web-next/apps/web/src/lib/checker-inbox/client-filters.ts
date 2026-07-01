/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem } from '@mifos/api-client';
import { isValid, parseISO, startOfDay } from 'date-fns';
import {
  coerceFineractDateTime,
  formatFineractDateTimeArray,
  parseFineractDateTimeString
} from '@/lib/fineract/dates';

export type CheckerInboxClientFilters = {
  maker?: string;
  actionName?: string;
  entityName?: string;
  processingResult?: string;
  resourceId?: string;
  id?: string;
  madeOnFrom?: string;
  madeOnTo?: string;
};

export type CheckerInboxClientFilterOptions = {
  makers: string[];
  actionNames: string[];
  entityNames: string[];
  processingResults: string[];
};

function uniqueSorted(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}

export function buildCheckerInboxClientFilterOptions(
  items: CheckerInboxListItem[]
): CheckerInboxClientFilterOptions {
  return {
    makers: uniqueSorted(items.map((item) => item.maker)),
    actionNames: uniqueSorted(items.map((item) => item.actionName)),
    entityNames: uniqueSorted(items.map((item) => item.entityName)),
    processingResults: uniqueSorted(items.map((item) => item.processingResult))
  };
}

export function countActiveCheckerInboxClientFilters(filters: CheckerInboxClientFilters): number {
  return Object.values(filters).filter((value) => Boolean(value?.trim())).length;
}

function itemMadeOnDate(item: CheckerInboxListItem): Date | null {
  const coerced = coerceFineractDateTime(item.madeOnDate);
  if (coerced == null) {
    return null;
  }
  if (typeof coerced === 'number') {
    const ms = coerced < 1e12 ? coerced * 1000 : coerced;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
  }
  if (typeof coerced === 'string') {
    const parsed = parseFineractDateTimeString(coerced);
    return parsed ? startOfDay(parsed) : null;
  }
  if (Array.isArray(coerced)) {
    const formatted = formatFineractDateTimeArray(coerced);
    if (!formatted) {
      return null;
    }
    const parsed = parseFineractDateTimeString(formatted);
    return parsed ? startOfDay(parsed) : null;
  }
  return null;
}

function parseFilterDate(value: string | undefined): Date | null {
  if (!value?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function applyCheckerInboxClientFilters(
  items: CheckerInboxListItem[],
  filters: CheckerInboxClientFilters
): CheckerInboxListItem[] {
  const maker = filters.maker?.trim();
  const actionName = filters.actionName?.trim();
  const entityName = filters.entityName?.trim();
  const processingResult = filters.processingResult?.trim();
  const resourceNeedle = filters.resourceId?.trim();
  const idNeedle = filters.id?.trim();
  const madeOnFrom = parseFilterDate(filters.madeOnFrom);
  const madeOnTo = parseFilterDate(filters.madeOnTo);

  return items.filter((item) => {
    if (maker && item.maker !== maker) {
      return false;
    }
    if (actionName && item.actionName !== actionName) {
      return false;
    }
    if (entityName && item.entityName !== entityName) {
      return false;
    }
    if (processingResult && item.processingResult !== processingResult) {
      return false;
    }
    if (resourceNeedle) {
      const resourceId = item.resourceId != null ? String(item.resourceId) : '';
      if (!resourceId.includes(resourceNeedle)) {
        return false;
      }
    }
    if (idNeedle && !String(item.id).includes(idNeedle)) {
      return false;
    }
    if (madeOnFrom || madeOnTo) {
      const madeOn = itemMadeOnDate(item);
      if (!madeOn) {
        return false;
      }
      if (madeOnFrom && madeOn < madeOnFrom) {
        return false;
      }
      if (madeOnTo && madeOn > madeOnTo) {
        return false;
      }
    }
    return true;
  });
}

export function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}
