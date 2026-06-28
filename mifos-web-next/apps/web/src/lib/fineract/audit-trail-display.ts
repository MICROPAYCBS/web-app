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
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  const normalized =
    withSpaces === withSpaces.toUpperCase()
      ? withSpaces.toLowerCase()
      : withSpaces.toLowerCase();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Human-readable label for a camelCase or dotted audit JSON field path. */
export function formatAuditTrailFieldLabel(keyPath: string): string {
  return keyPath
    .split('.')
    .map((segment) => {
      const arrayMatch = /^(.+)\[(\d+)\]$/.exec(segment);
      if (arrayMatch) {
        const [, name, index] = arrayMatch;
        return `${formatAuditTrailFilterLabel(name)} [${Number(index) + 1}]`;
      }
      return formatAuditTrailFilterLabel(segment);
    })
    .join(' · ');
}

export type AuditTrailCommandField = {
  key: string;
  label: string;
  display: string;
  kind: 'text' | 'json';
};

function isAuditTrailPrimitive(value: unknown): value is string | number | boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function flattenAuditTrailValue(
  value: unknown,
  prefix: string,
  out: Array<{ key: string; value: unknown }>
): void {
  if (value === null || value === undefined) {
    if (prefix) {
      out.push({ key: prefix, value });
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (prefix) {
        out.push({ key: prefix, value: [] });
      }
      return;
    }

    const allPrimitives = value.every((item) => isAuditTrailPrimitive(item));
    if (allPrimitives) {
      out.push({
        key: prefix,
        value: value.map((item) => formatAuditTrailCommandValue(item).display).join(', ')
      });
      return;
    }

    value.forEach((item, index) => {
      const nextKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
      if (item !== null && typeof item === 'object') {
        flattenAuditTrailValue(item, nextKey, out);
      } else {
        out.push({ key: nextKey, value: item });
      }
    });
    return;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      if (prefix) {
        out.push({ key: prefix, value: {} });
      }
      return;
    }

    for (const [key, nestedValue] of entries) {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (nestedValue !== null && typeof nestedValue === 'object') {
        flattenAuditTrailValue(nestedValue, nextKey, out);
      } else {
        out.push({ key: nextKey, value: nestedValue });
      }
    }
    return;
  }

  if (prefix) {
    out.push({ key: prefix, value });
  }
}

export function formatAuditTrailCommandValue(value: unknown): {
  display: string;
  kind: 'text' | 'json';
} {
  if (value === null || value === undefined || value === '') {
    return { display: '—', kind: 'text' };
  }
  if (typeof value === 'boolean') {
    return { display: value ? 'Yes' : 'No', kind: 'text' };
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return { display: String(value), kind: 'text' };
  }
  try {
    return {
      display: JSON.stringify(value, null, 2),
      kind: 'json'
    };
  } catch {
    return { display: String(value), kind: 'text' };
  }
}

export function parseAuditTrailCommandFields(
  commandAsJson: string | undefined
): AuditTrailCommandField[] {
  if (!commandAsJson?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(commandAsJson) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const flattened: Array<{ key: string; value: unknown }> = [];
    if (Array.isArray(parsed)) {
      flattenAuditTrailValue(parsed, '', flattened);
    } else {
      flattenAuditTrailValue(parsed, '', flattened);
    }

    return flattened.map(({ key, value }) => {
      const formatted = formatAuditTrailCommandValue(value);
      return {
        key,
        label: formatAuditTrailFieldLabel(key),
        display: formatted.display,
        kind: formatted.kind
      };
    });
  } catch {
    return [];
  }
}

/** @deprecated Prefer {@link parseAuditTrailCommandFields} for labelled field display. */
export function parseAuditTrailCommands(commandAsJson: string | undefined): Array<{
  command: string;
  commandValue: string;
}> {
  return parseAuditTrailCommandFields(commandAsJson).map((field) => ({
    command: field.label,
    commandValue: field.display === '—' ? '' : field.display
  }));
}
