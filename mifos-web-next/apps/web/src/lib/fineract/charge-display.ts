/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeDetail, ChargeListItem } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

/** Flat amount — all other calculation types are percentage-based. */
export const CHARGE_CALCULATION_FLAT = 1;

export const PERCENTAGE_CHARGE_CALCULATION_IDS = [2, 3, 4, 5] as const;

export interface ChargeAmountLike {
  id?: number;
  name?: string;
  amount?: number;
  currency?: { code?: string };
  currencyCode?: string;
  chargeCalculationType?: { id?: number };
}

export function chargeCurrencyCode(charge: ChargeListItem | ChargeDetail): string {
  return chargeCurrencyCodeFromLike(charge) || '—';
}

export function chargeCurrencyCodeFromLike(
  charge: ChargeAmountLike,
  fallbackCurrencyCode?: string
): string {
  const code = charge.currency?.code ?? charge.currencyCode ?? fallbackCurrencyCode ?? '';
  return code.trim().toUpperCase();
}

export function chargeCalculationTypeId(charge?: ChargeAmountLike): number | undefined {
  return charge?.chargeCalculationType?.id;
}

export function isPercentageChargeCalculation(calculationTypeId?: number): boolean {
  return (
    calculationTypeId != null &&
    (PERCENTAGE_CHARGE_CALCULATION_IDS as readonly number[]).includes(calculationTypeId)
  );
}

export function isFlatChargeCalculation(calculationTypeId?: number): boolean {
  return calculationTypeId === CHARGE_CALCULATION_FLAT;
}

function formatPercentageAmount(amount: number): string {
  return `${new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  }).format(amount)}%`;
}

export function formatChargeAmountDisplay(
  charge: ChargeAmountLike,
  fallbackCurrencyCode?: string
): string {
  const amount = charge.amount;
  if (amount == null) {
    return '—';
  }
  if (isPercentageChargeCalculation(chargeCalculationTypeId(charge))) {
    return formatPercentageAmount(amount);
  }
  const code = chargeCurrencyCodeFromLike(charge, fallbackCurrencyCode);
  return formatMoney(amount, code) ?? String(amount);
}

export function formatProductChargeOptionLabel(
  charge: ChargeAmountLike,
  fallbackCurrencyCode?: string
): string {
  const name = charge.name?.trim();
  const amountLabel = formatChargeAmountDisplay(charge, fallbackCurrencyCode);
  if (!name) {
    return amountLabel;
  }
  if (amountLabel === '—') {
    return name;
  }
  return `${name} · ${amountLabel}`;
}

export function productChargeLabelById(
  options: ChargeAmountLike[] | undefined,
  id: number | undefined,
  fallbackCurrencyCode?: string
): string {
  if (id == null) {
    return '—';
  }
  const match = options?.find((option) => option.id === id);
  return match ? formatProductChargeOptionLabel(match, fallbackCurrencyCode) : String(id);
}

export function chargeAppliesToLabel(charge: ChargeListItem | ChargeDetail): string {
  return enumOptionLabel(charge.chargeAppliesTo) ?? '—';
}

export function chargeTimeTypeLabel(charge: ChargeListItem | ChargeDetail): string {
  return enumOptionLabel(charge.chargeTimeType) ?? '—';
}

export function chargeCalculationTypeLabel(charge: ChargeListItem | ChargeDetail): string {
  return enumOptionLabel(charge.chargeCalculationType) ?? '—';
}

export function chargePaymentModeLabel(charge: ChargeDetail): string {
  return enumOptionLabel(charge.chargePaymentMode) ?? '—';
}

export function glAccountLabel(account?: { glCode?: string; name?: string }): string {
  if (!account) {
    return '—';
  }
  if (account.glCode && account.name) {
    return `${account.glCode} — ${account.name}`;
  }
  return account.name ?? account.glCode ?? '—';
}
