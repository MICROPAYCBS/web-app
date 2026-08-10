/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ChargeIncomeAccountMapping,
  FineractCurrencyOption,
  FineractEnumOption,
  LoanProductCharge,
  PaymentChannelFundSourceMapping,
  ProductGlAccountRef
} from '@mifos/api-client';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

/** Normalize product start/close dates from Fineract GET payloads to form strings. */
export function asProductDateString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return fineractApiDateToFormString(value);
  }
  if (Array.isArray(value) && value.every((part) => typeof part === 'number')) {
    return fineractApiDateToFormString(value as number[]);
  }
  return undefined;
}

export function asEnumOption(value: unknown): FineractEnumOption | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return undefined;
  }
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

/**
 * Map a template default or stored enum to the id used in option lists.
 * Fineract template defaults often use `ordinal` as id while option lists use `ordinal + 1`.
 */
export function resolveEnumOptionId(
  templateValue: unknown,
  options: unknown[] | undefined
): number | undefined {
  const resolved = asEnumOption(templateValue);
  const list = (options ?? [])
    .map((item) => asEnumOption(item))
    .filter((item): item is FineractEnumOption => item != null);

  if (resolved?.code) {
    const byCode = list.find((item) => item.code === resolved.code);
    if (byCode?.id != null) {
      return byCode.id;
    }
  }

  if (resolved?.id != null && list.some((item) => item.id === resolved.id)) {
    return resolved.id;
  }

  return list[0]?.id;
}

export function asCurrency(value: unknown): FineractCurrencyOption | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  const code = typeof row.code === 'string' ? row.code : undefined;
  if (!code) {
    return undefined;
  }
  return {
    code,
    name: typeof row.name === 'string' ? row.name : undefined,
    decimalPlaces:
      typeof row.decimalPlaces === 'number' ? row.decimalPlaces : undefined
  };
}

export function asGlAccount(value: unknown): ProductGlAccountRef | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  return {
    id: Number.isFinite(id) ? id : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
    glCode: typeof row.glCode === 'string' ? row.glCode : undefined
  };
}

export function asAccountingMappings(
  value: unknown
): Record<string, ProductGlAccountRef | undefined> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const out: Record<string, ProductGlAccountRef | undefined> = {};
  for (const [key, account] of Object.entries(value as Record<string, unknown>)) {
    out[key] = asGlAccount(account);
  }
  return out;
}

export function asCharges(value: unknown): LoanProductCharge[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const charges: LoanProductCharge[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    charges.push({
      id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
      name: typeof row.name === 'string' ? row.name : undefined,
      amount: typeof row.amount === 'number' ? row.amount : undefined,
      penalty: typeof row.penalty === 'boolean' ? row.penalty : undefined,
      useChargeTiers: typeof row.useChargeTiers === 'boolean' ? row.useChargeTiers : undefined,
      chargeCalculationType: asEnumOption(row.chargeCalculationType),
      chargeTimeType: asEnumOption(row.chargeTimeType),
      currency: asCurrency(row.currency)
    });
  }
  return charges;
}

export function asPaymentChannelMappings(value: unknown): PaymentChannelFundSourceMapping[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: PaymentChannelFundSourceMapping[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const paymentType = row.paymentType;
    rows.push({
      paymentType:
        paymentType && typeof paymentType === 'object'
          ? {
              id: Number.isFinite(Number((paymentType as Record<string, unknown>).id))
                ? Number((paymentType as Record<string, unknown>).id)
                : undefined,
              name:
                typeof (paymentType as Record<string, unknown>).name === 'string'
                  ? ((paymentType as Record<string, unknown>).name as string)
                  : undefined
            }
          : undefined,
      fundSourceAccount: asGlAccount(row.fundSourceAccount)
    });
  }
  return rows;
}

export function asChargeIncomeMappings(value: unknown): ChargeIncomeAccountMapping[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: ChargeIncomeAccountMapping[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const charge = row.charge;
    rows.push({
      charge:
        charge && typeof charge === 'object'
          ? {
              id: Number.isFinite(Number((charge as Record<string, unknown>).id))
                ? Number((charge as Record<string, unknown>).id)
                : undefined,
              name:
                typeof (charge as Record<string, unknown>).name === 'string'
                  ? ((charge as Record<string, unknown>).name as string)
                  : undefined
            }
          : undefined,
      incomeAccount: asGlAccount(row.incomeAccount)
    });
  }
  return rows;
}

export function listItemCurrencyCode(row: Record<string, unknown>): string | undefined {
  if (typeof row.currencyCode === 'string' && row.currencyCode.trim()) {
    return row.currencyCode.trim();
  }
  return asCurrency(row.currency)?.code;
}

export function normalizeFineractList<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null
): T[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeItem(item))
      .filter((item): item is T => item !== null);
  }
  if (value && typeof value === 'object' && 'pageItems' in value) {
    return normalizeFineractList((value as { pageItems?: unknown }).pageItems, normalizeItem);
  }
  return [];
}
