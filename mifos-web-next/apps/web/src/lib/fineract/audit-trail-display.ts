/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
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

export function auditTrailResultVariant(
  result: string | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!result) {
    return 'outline';
  }
  const normalized = result.toLowerCase();
  if (normalized.includes('success') || normalized.includes('processed')) {
    return 'default';
  }
  if (normalized.includes('fail') || normalized.includes('reject')) {
    return 'destructive';
  }
  return 'secondary';
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

export type AuditTrailFieldChangeType = 'unchanged' | 'added' | 'changed' | 'removed';

export type AuditTrailCommandField = {
  key: string;
  label: string;
  display: string;
  kind: 'text' | 'json';
  previousDisplay?: string;
  previousKind?: 'text' | 'json';
  changeType: AuditTrailFieldChangeType;
  /** @deprecated Use {@link AuditTrailCommandField.changeType} instead. */
  changed?: boolean;
};

function auditTrailMadeOnEpochMs(value: FineractDateTimeValue | undefined): number | null {
  const coerced = coerceFineractDateTime(value);
  if (coerced == null) {
    return null;
  }
  if (typeof coerced === 'number') {
    return coerced < 1e12 ? coerced * 1000 : coerced;
  }
  if (typeof coerced === 'string') {
    const parsed = parseFineractDateTimeString(coerced);
    return parsed ? parsed.getTime() : null;
  }
  const formatted = formatFineractDateTimeArray(coerced);
  if (!formatted) {
    return null;
  }
  const parsed = parseFineractDateTimeString(formatted);
  return parsed ? parsed.getTime() : null;
}

/** Oldest-first ordering for entity audit timelines. */
export function compareAuditTrailsChronologically(
  a: FineractAuditTrailListItem,
  b: FineractAuditTrailListItem
): number {
  const aTime = auditTrailMadeOnEpochMs(a.madeOnDate);
  const bTime = auditTrailMadeOnEpochMs(b.madeOnDate);
  if (aTime != null && bTime != null && aTime !== bTime) {
    return aTime - bTime;
  }
  return a.id - b.id;
}

export function sortAuditTrailsChronologically(
  audits: FineractAuditTrailListItem[]
): FineractAuditTrailListItem[] {
  return [...audits].sort(compareAuditTrailsChronologically);
}

/** Newest-first ordering for entity audit lists. */
export function sortAuditTrailsNewestFirst(
  audits: FineractAuditTrailListItem[]
): FineractAuditTrailListItem[] {
  return [...audits].sort((a, b) => compareAuditTrailsChronologically(b, a));
}

export function resolvePreviousAuditCommandJson(
  audits: FineractAuditTrailListItem[],
  currentAuditId: number
): string | undefined {
  const sorted = sortAuditTrailsChronologically(audits);
  const index = sorted.findIndex((audit) => audit.id === currentAuditId);
  if (index <= 0) {
    return undefined;
  }
  const previous = sorted[index - 1];
  return typeof previous.commandAsJson === 'string' ? previous.commandAsJson : undefined;
}

function serializeAuditTrailFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function computeChangedAuditFieldKeys(
  currentCommandAsJson: string | undefined,
  previousCommandAsJson: string | undefined
): Set<string> {
  return new Set(
    parseAuditTrailCommandFieldsWithDiff(currentCommandAsJson, previousCommandAsJson)
      .filter((field) => field.changeType !== 'unchanged')
      .map((field) => field.key)
  );
}

function flattenAuditTrailCommandEntries(
  commandAsJson: string | undefined
): Array<{ key: string; value: unknown }> {
  if (!commandAsJson?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(commandAsJson) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const flattened: Array<{ key: string; value: unknown }> = [];
    flattenAuditTrailValue(parsed, '', flattened);
    return flattened;
  } catch {
    return [];
  }
}

function isAbsentAuditValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function auditTrailTopLevelKey(key: string): string {
  const match = /^([^.\[]+)/.exec(key);
  return match?.[1] ?? key;
}

function resolveAuditFieldChangeType(
  value: unknown,
  previousValue: unknown | undefined,
  hasPrevious: boolean
): AuditTrailFieldChangeType {
  if (!hasPrevious || isAbsentAuditValue(value)) {
    return 'unchanged';
  }
  if (previousValue === undefined) {
    return 'added';
  }
  if (serializeAuditTrailFieldValue(previousValue) !== serializeAuditTrailFieldValue(value)) {
    return 'changed';
  }
  return 'unchanged';
}

/** Drop unchanged top-level groups — partial updates omit untouched branches. */
function filterUnchangedAuditTopLevelGroups(fields: AuditTrailCommandField[]): AuditTrailCommandField[] {
  const topsWithChanges = new Set(
    fields
      .filter((field) => field.changeType !== 'unchanged')
      .map((field) => auditTrailTopLevelKey(field.key))
  );

  return fields.filter((field) => topsWithChanges.has(auditTrailTopLevelKey(field.key)));
}

function toAuditTrailCommandField(
  key: string,
  value: unknown,
  changeType: AuditTrailFieldChangeType,
  previousValue?: unknown
): AuditTrailCommandField {
  const formatted = formatAuditTrailCommandValue(value);
  const previousFormatted =
    previousValue !== undefined ? formatAuditTrailCommandValue(previousValue) : undefined;

  return {
    key,
    label: formatAuditTrailFieldLabel(key),
    display: formatted.display,
    kind: formatted.kind,
    previousDisplay: previousFormatted?.display,
    previousKind: previousFormatted?.kind,
    changeType,
    changed: changeType !== 'unchanged'
  };
}

export function parseAuditTrailCommandFieldsWithDiff(
  currentCommandAsJson: string | undefined,
  previousCommandAsJson?: string
): AuditTrailCommandField[] {
  const currentEntries = flattenAuditTrailCommandEntries(currentCommandAsJson);
  const previousEntries = flattenAuditTrailCommandEntries(previousCommandAsJson);
  const previousMap = new Map(previousEntries.map((entry) => [entry.key, entry.value]));
  const fields: AuditTrailCommandField[] = [];
  const hasPrevious = Boolean(previousCommandAsJson?.trim());

  for (const { key, value } of currentEntries) {
    const previousValue = previousMap.get(key);
    const changeType = resolveAuditFieldChangeType(value, previousValue, hasPrevious);
    const displayValue =
      isAbsentAuditValue(value) && previousValue !== undefined ? previousValue : value;

    fields.push(
      toAuditTrailCommandField(
        key,
        displayValue,
        changeType,
        changeType === 'added'
          ? null
          : changeType === 'changed'
            ? previousValue
            : undefined
      )
    );
  }

  if (!hasPrevious) {
    return fields;
  }

  return filterUnchangedAuditTopLevelGroups(fields);
}

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
  commandAsJson: string | undefined,
  options?: { changedFieldKeys?: ReadonlySet<string> }
): AuditTrailCommandField[] {
  const fields = parseAuditTrailCommandFieldsWithDiff(commandAsJson);
  const changedFieldKeys = options?.changedFieldKeys;

  if (!changedFieldKeys) {
    return fields;
  }

  return fields.map((field) => ({
    ...field,
    changeType: changedFieldKeys.has(field.key) ? field.changeType : 'unchanged',
    changed: changedFieldKeys.has(field.key)
  }));
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
