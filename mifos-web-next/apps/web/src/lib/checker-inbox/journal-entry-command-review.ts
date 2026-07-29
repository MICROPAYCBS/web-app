/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

function normalizeEntity(entityName?: string | null): string {
  return (entityName ?? '').trim().toUpperCase().replace(/[\s_-]+/g, '');
}

export function isJournalEntryCheckerEntity(entityName?: string | null): boolean {
  return normalizeEntity(entityName) === 'JOURNALENTRY';
}

export function isCreateJournalEntryCheckerCommand(
  actionName?: string | null,
  entityName?: string | null
): boolean {
  return (
    (actionName ?? '').trim().toUpperCase() === 'CREATE' && isJournalEntryCheckerEntity(entityName)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

/** Parse maker-checker `commandAsJson` for journal entry commands. */
export function parseJournalEntryCommandAsJson(
  commandAsJson: string | undefined | null
): Record<string, unknown> | null {
  if (!commandAsJson?.trim()) {
    return null;
  }
  try {
    return asRecord(JSON.parse(commandAsJson) as unknown);
  } catch {
    return null;
  }
}

/** Subject line for list/sheet from narration or date + currency. */
export function journalEntrySubjectFromCommandAsJson(
  commandAsJson: string | undefined | null
): string | undefined {
  const payload = parseJournalEntryCommandAsJson(commandAsJson);
  if (!payload) {
    return undefined;
  }
  const comments = asString(payload.comments);
  if (comments) {
    return comments.length > 80 ? `${comments.slice(0, 77)}…` : comments;
  }
  const date = asString(payload.transactionDate);
  const currency = asString(payload.currencyCode);
  if (date && currency) {
    return `${currency} · ${date}`;
  }
  return date ?? currency;
}

export function journalEntryTransactionIdFromCommandAsJson(
  commandAsJson: string | undefined | null
): string | undefined {
  const payload = parseJournalEntryCommandAsJson(commandAsJson);
  return asString(payload?.transactionId);
}

/** Preferred highlight keys for journal entry checker tasks. */
export const JOURNAL_ENTRY_PREFERRED_COMMAND_KEYS = [
  'comments',
  'transactionDate',
  'currencyCode',
  'officeId',
  'accountingRule',
  'referenceNumber',
  'paymentTypeId',
  'debits',
  'credits',
  'transactionComments'
] as const;

export function journalEntryCommandHighlightLimit(): number {
  return 6;
}
