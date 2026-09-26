/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  SavingsAccountPaymentChannel,
  SavingsProductPaymentChannel,
  SavingsProductPaymentChannelCharge
} from '@mifos/api-client';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function positiveId(value: unknown): number | undefined {
  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return id;
}

function channelList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  const row = asRecord(raw);
  if (!row) {
    return [];
  }
  for (const key of ['paymentChannels', 'pageItems', 'content'] as const) {
    if (Array.isArray(row[key])) {
      return row[key] as unknown[];
    }
  }
  return [];
}

function finiteAmount(value: unknown): number | undefined {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

/**
 * Charge identity for the catalog is the charge definition id.
 * GET link rows use `chargeId` / `charge.id`; `id` on that row is the link id.
 * A write-shaped row `{ id, amount }` has no `chargeId`, so `id` is the definition.
 */
function chargeDefinitionId(row: Record<string, unknown>): number | undefined {
  const nested = asRecord(row.charge);
  const fromDefinition = positiveId(row.chargeId ?? nested?.id);
  if (fromDefinition != null) {
    return fromDefinition;
  }
  if (nested == null && row.chargeId == null) {
    return positiveId(row.id);
  }
  return undefined;
}

function chargeRows(raw: unknown): SavingsProductPaymentChannelCharge[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const charges: SavingsProductPaymentChannelCharge[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const id = chargeDefinitionId(row);
    if (id == null || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const nested = asRecord(row.charge);
    const name =
      typeof nested?.name === 'string'
        ? nested.name
        : typeof row.name === 'string'
          ? row.name
          : undefined;
    const definitionAmount = finiteAmount(nested?.amount);
    charges.push({
      id,
      name,
      amount: finiteAmount(row.amount),
      ...(definitionAmount != null ? { definitionAmount } : {}),
      useChargeTiers: nested?.useChargeTiers === true || row.useChargeTiers === true
    });
  }
  return charges;
}

function paymentTypeName(row: Record<string, unknown>): string | undefined {
  if (typeof row.paymentTypeName === 'string' && row.paymentTypeName.trim()) {
    return row.paymentTypeName;
  }
  const paymentType = asRecord(row.paymentType);
  if (typeof paymentType?.name === 'string' && paymentType.name.trim()) {
    return paymentType.name;
  }
  if (typeof row.name === 'string' && row.name.trim()) {
    return row.name;
  }
  return undefined;
}

export function normalizeSavingsProductPaymentChannels(
  raw: unknown
): SavingsProductPaymentChannel[] {
  const channels: SavingsProductPaymentChannel[] = [];
  const seen = new Set<number>();
  for (const item of channelList(raw)) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const paymentType = asRecord(row.paymentType);
    const paymentTypeId = positiveId(row.paymentTypeId ?? paymentType?.id);
    if (paymentTypeId == null || seen.has(paymentTypeId)) {
      continue;
    }
    seen.add(paymentTypeId);
    channels.push({
      paymentTypeId,
      paymentTypeName: paymentTypeName(row),
      isPremium: row.isPremium === true,
      isActive: row.isActive !== false,
      charges: chargeRows(row.charges)
    });
  }
  return channels;
}

function isSubscribed(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!normalized || normalized.includes('not') || normalized === 'false' || normalized === '0') {
      return false;
    }
    return normalized === 'subscribed' || normalized === 'active' || normalized === 'true';
  }
  const row = asRecord(value);
  if (!row) {
    return false;
  }
  if (row.subscribed === true || row.active === true) {
    return true;
  }
  const code = typeof row.code === 'string' ? row.code.toLowerCase() : '';
  const label = typeof row.value === 'string' ? row.value.toLowerCase() : '';
  const text = `${code} ${label}`;
  if (text.includes('not')) {
    return false;
  }
  return text.includes('subscribed');
}

export function normalizeSavingsAccountPaymentChannels(
  raw: unknown
): SavingsAccountPaymentChannel[] {
  const channels: SavingsAccountPaymentChannel[] = [];
  for (const item of channelList(raw)) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const [channel] = normalizeSavingsProductPaymentChannels([row]);
    if (!channel) {
      continue;
    }
    const subscribed = isSubscribed(
      row.subscriptionStatus ?? row.subscribed ?? row.isSubscribed
    );
    const allowedForDeposit =
      typeof row.allowedForDeposit === 'boolean'
        ? row.allowedForDeposit
        : channel.isActive && (!channel.isPremium || subscribed);
    channels.push({
      ...channel,
      subscribed,
      allowedForDeposit
    });
  }
  return channels;
}
