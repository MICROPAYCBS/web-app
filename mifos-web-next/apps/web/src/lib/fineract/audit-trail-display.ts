/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  coerceFineractDateTime,
  formatFineractDateTimeArray,
  parseFineractDateTimeString,
  type FineractDateTimeValue
} from '@/lib/fineract/dates';

function formatResolvedDateTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatAuditTrailDateTime(value: FineractDateTimeValue | undefined): string {
  const coerced = coerceFineractDateTime(value);
  if (coerced == null) {
    return '—';
  }
  if (typeof coerced === 'number') {
    const ms = coerced < 1e12 ? coerced * 1000 : coerced;
    const parsed = new Date(ms);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return formatResolvedDateTime(parsed);
  }
  if (typeof coerced === 'string') {
    const parsed = parseFineractDateTimeString(coerced);
    if (!parsed) {
      return coerced;
    }
    return formatResolvedDateTime(parsed);
  }
  return formatFineractDateTimeArray(coerced) ?? '—';
}

export function formatAuditTrailFilterLabel(value: string): string {
  if (!value.trim()) {
    return value;
  }
  const withSpaces = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  if (withSpaces === withSpaces.toUpperCase()) {
    return withSpaces
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return withSpaces;
}

export function parseAuditTrailCommands(commandAsJson: string | undefined): Array<{
  command: string;
  commandValue: string;
}> {
  if (!commandAsJson?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(commandAsJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [];
    }
    return Object.entries(parsed as Record<string, unknown>).map(([command, commandValue]) => ({
      command,
      commandValue:
        commandValue == null
          ? ''
          : typeof commandValue === 'string'
            ? commandValue
            : JSON.stringify(commandValue)
    }));
  } catch {
    return [];
  }
}
