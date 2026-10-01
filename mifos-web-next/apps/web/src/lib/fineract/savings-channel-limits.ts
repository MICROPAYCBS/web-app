/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  SavingsAccountChannelLimit,
  SavingsChannelLimitDirection
} from '@mifos/api-client';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

const LIMIT_NUMBER_FIELDS = [
  'ceilingPerTxn',
  'ceilingPerDay',
  'ceilingPerMonth',
  'ceilingCountPerDay',
  'ceilingCountPerMonth',
  'maxPerTxn',
  'maxPerDay',
  'maxPerMonth',
  'maxCountPerDay',
  'maxCountPerMonth',
  'pendingMaxPerTxn',
  'pendingMaxPerDay',
  'pendingMaxPerMonth',
  'pendingMaxCountPerDay',
  'pendingMaxCountPerMonth',
  'effectivePerTxn',
  'effectivePerDay',
  'effectivePerMonth',
  'effectiveCountPerDay',
  'effectiveCountPerMonth',
  'usedToday',
  'countToday',
  'usedThisMonth',
  'countThisMonth',
  'remainingToday',
  'remainingThisMonth',
  'remainingCountToday',
  'remainingCountThisMonth'
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** Null stays null. Zero stays zero. A missing or unreadable value is null, never zero. */
function nullableNumber(row: Record<string, unknown>, key: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(row, key)) {
    return null;
  }
  const value = row[key];
  if (value == null || value === '') {
    return null;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function directionOf(value: unknown): SavingsChannelLimitDirection | null {
  if (value === 'DEBIT' || value === 'CREDIT') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'DEBIT' || normalized === 'CREDIT') {
      return normalized;
    }
  }
  return null;
}

function limitList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  const row = asRecord(raw);
  if (!row) {
    return [];
  }
  for (const key of ['pageItems', 'content', 'limits'] as const) {
    if (Array.isArray(row[key])) {
      return row[key] as unknown[];
    }
  }
  if (directionOf(row.direction)) {
    return [row];
  }
  return [];
}

export function normalizeSavingsAccountChannelLimits(raw: unknown): SavingsAccountChannelLimit[] {
  const limits: SavingsAccountChannelLimit[] = [];
  for (const item of limitList(raw)) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const direction = directionOf(row.direction);
    const productPaymentChannelId = Number(row.productPaymentChannelId);
    const paymentTypeId = Number(row.paymentTypeId);
    if (
      !direction ||
      !Number.isFinite(productPaymentChannelId) ||
      productPaymentChannelId <= 0 ||
      !Number.isFinite(paymentTypeId) ||
      paymentTypeId <= 0
    ) {
      continue;
    }
    const idValue = row.id;
    const id =
      idValue == null || idValue === ''
        ? null
        : Number.isFinite(Number(idValue))
          ? Number(idValue)
          : null;
    const pendingEffectiveOn =
      typeof row.pendingEffectiveOn === 'string' && row.pendingEffectiveOn.trim()
        ? row.pendingEffectiveOn
        : null;
    const numbers = Object.fromEntries(
      LIMIT_NUMBER_FIELDS.map((key) => [key, nullableNumber(row, key)])
    ) as Pick<SavingsAccountChannelLimit, (typeof LIMIT_NUMBER_FIELDS)[number]>;
    limits.push({
      id,
      savingsAccountId: Number.isFinite(Number(row.savingsAccountId))
        ? Number(row.savingsAccountId)
        : undefined,
      productPaymentChannelId,
      paymentTypeId,
      direction,
      pendingEffectiveOn,
      ...numbers
    });
  }
  return limits;
}

/** A null cap is unlimited. Zero is blocked. */
export function formatChannelCap(
  value: number | null,
  kind: 'amount' | 'count',
  currencyCode: string
): string {
  if (value == null) {
    return 'No limit';
  }
  if (value === 0) {
    return 'Blocked';
  }
  return kind === 'count' ? String(value) : formatAccountMoney(value, currencyCode);
}

/** A null remaining amount is unlimited. Zero means nothing left. */
export function formatChannelRemaining(
  value: number | null,
  kind: 'amount' | 'count',
  currencyCode: string
): string {
  if (value == null) {
    return 'No limit';
  }
  return kind === 'count' ? String(value) : formatAccountMoney(value, currencyCode);
}

export function formatChannelUsage(
  value: number | null,
  kind: 'amount' | 'count',
  currencyCode: string
): string {
  if (value == null) {
    return '—';
  }
  return kind === 'count' ? String(value) : formatAccountMoney(value, currencyCode);
}

export function channelLimitIsEnforced(limit: SavingsAccountChannelLimit): boolean {
  return [
    limit.effectivePerTxn,
    limit.effectivePerDay,
    limit.effectivePerMonth,
    limit.effectiveCountPerDay,
    limit.effectiveCountPerMonth
  ].some((value) => value != null);
}

export function formatPendingEffectiveOn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
