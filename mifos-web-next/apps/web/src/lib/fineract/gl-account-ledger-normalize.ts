/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractGlAccountLedgerEntry,
  FineractGlAccountLedgerResponse,
  FineractGlAccountLedgerSummary
} from '@mifos/api-client';
import { fineractDateToIso } from '@/lib/fineract/date-input';
import { fromFineractDateArray } from '@/lib/fineract/dates';

function readNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Fineract Jackson LocalDate → `yyyy-MM-dd` (string or `[y, m, d]`). */
function coerceLedgerEntryDate(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    return fineractDateToIso(trimmed) || trimmed;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const parts = value.slice(0, 3).map(Number);
    if (parts.every((n) => Number.isFinite(n))) {
      const date = fromFineractDateArray(parts);
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }
  return '';
}

function coerceTransactionId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeSummary(raw: unknown): FineractGlAccountLedgerSummary | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const lastUpdatedRaw = row.lastUpdated;
  const lastUpdated =
    typeof lastUpdatedRaw === 'string' && lastUpdatedRaw.trim()
      ? lastUpdatedRaw.trim()
      : null;
  return {
    openingBalance: readNumber(row.openingBalance),
    totalDebit: readNumber(row.totalDebit),
    totalCredit: readNumber(row.totalCredit),
    closingBalance: readNumber(row.closingBalance),
    lastUpdated
  };
}

function normalizeEntry(raw: unknown): FineractGlAccountLedgerEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const transactionId = coerceTransactionId(row.transactionId);
  const entryDate = coerceLedgerEntryDate(row.entryDate);
  if (!transactionId || !entryDate) {
    return null;
  }
  const description =
    typeof row.description === 'string' && row.description.trim()
      ? row.description.trim()
      : null;
  const source = typeof row.source === 'string' && row.source.trim() ? row.source.trim() : '—';
  return {
    entryDate,
    transactionId,
    description,
    source,
    debit: readNumber(row.debit),
    credit: readNumber(row.credit),
    runningBalance: readNumber(row.runningBalance)
  };
}

/** Normalize raw `GET /glaccounts/{id}/ledger` JSON. */
export function normalizeGlAccountLedgerResponse(
  raw: unknown,
  glAccountId: number
): FineractGlAccountLedgerResponse | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const summary = normalizeSummary(row.summary);
  if (!summary) {
    return null;
  }

  const entriesRaw = row.entries;
  const entries = Array.isArray(entriesRaw)
    ? entriesRaw
        .map((item) => normalizeEntry(item))
        .filter((item): item is FineractGlAccountLedgerEntry => item !== null)
    : [];

  const officeId = readNumber(row.officeId, NaN);
  const currencyCode =
    typeof row.currencyCode === 'string' ? row.currencyCode.trim().toUpperCase() : '';
  if (!Number.isFinite(officeId) || officeId <= 0 || !currencyCode) {
    return null;
  }

  const departmentIdRaw = row.departmentId;
  const departmentId =
    departmentIdRaw == null || departmentIdRaw === ''
      ? null
      : readNumber(departmentIdRaw, NaN);
  const departmentNameRaw = row.departmentName;
  const departmentName =
    typeof departmentNameRaw === 'string' && departmentNameRaw.trim()
      ? departmentNameRaw.trim()
      : null;

  return {
    glAccountId: readNumber(row.glAccountId, glAccountId),
    glCode: typeof row.glCode === 'string' ? row.glCode.trim() : '',
    glAccountName: typeof row.glAccountName === 'string' ? row.glAccountName.trim() : '',
    officeId,
    officeName: typeof row.officeName === 'string' ? row.officeName.trim() : String(officeId),
    departmentId: departmentId != null && Number.isFinite(departmentId) ? departmentId : null,
    departmentName: departmentId === 0 ? null : departmentName,
    currencyCode,
    startDate: coerceLedgerEntryDate(row.startDate),
    endDate: coerceLedgerEntryDate(row.endDate),
    summary,
    entries
  };
}
