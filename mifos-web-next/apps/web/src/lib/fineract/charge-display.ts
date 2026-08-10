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
  useChargeTiers?: boolean;
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

export function chargeAmountInputLabel(charge?: ChargeAmountLike): string {
  return isPercentageChargeCalculation(chargeCalculationTypeId(charge)) ? 'Rate (%)' : 'Amount';
}

export function formatChargeAmountLimitDisplay(
  amount: number,
  charge: ChargeAmountLike | undefined,
  fallbackCurrencyCode?: string
): string {
  if (isPercentageChargeCalculation(chargeCalculationTypeId(charge))) {
    return `${new Intl.NumberFormat('en', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(amount)}%`;
  }
  const code = chargeAmountCurrencyCode(charge, fallbackCurrencyCode);
  if (code) {
    return formatMoney(amount, code) ?? String(amount);
  }
  return String(amount);
}

export function formatChargeAmountRangeHint(
  charge: ChargeAmountLike & { minCap?: number; maxCap?: number },
  fallbackCurrencyCode?: string
): string | undefined {
  const minCap = charge.minCap;
  const maxCap = charge.maxCap;
  if (minCap == null && maxCap == null) {
    return undefined;
  }

  const percentage = isPercentageChargeCalculation(chargeCalculationTypeId(charge));
  const formatLimit = (value: number) =>
    formatChargeAmountLimitDisplay(value, charge, fallbackCurrencyCode);

  if (minCap != null && maxCap != null) {
    return `${formatLimit(minCap)} – ${formatLimit(maxCap)}`;
  }
  if (minCap != null) {
    return `Minimum ${formatLimit(minCap)}`;
  }
  return `Maximum ${formatLimit(maxCap as number)}`;
}

export function chargeAmountCurrencyCode(
  charge: ChargeAmountLike | undefined,
  fallbackCurrencyCode?: string
): string | undefined {
  const code = chargeCurrencyCodeFromLike(charge ?? {}, fallbackCurrencyCode);
  return code || fallbackCurrencyCode?.trim().toUpperCase() || undefined;
}

function formatPercentageAmount(amount: number): string {
  return `${new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  }).format(amount)}%`;
}

/** Format a lookup tier base-amount range using the charge currency ISO code. */
export function formatChargeTierRange(
  amountRangeFrom: number | undefined,
  amountRangeTo: number | null | undefined,
  currencyCode?: string
): string {
  if (amountRangeFrom == null) {
    return '—';
  }
  const code = currencyCode?.trim().toUpperCase() ?? '';
  const fromLabel = code
    ? (formatMoney(amountRangeFrom, code) ?? String(amountRangeFrom))
    : String(amountRangeFrom);
  if (amountRangeTo == null) {
    return `${fromLabel} – ∞`;
  }
  const toLabel = code
    ? (formatMoney(amountRangeTo, code) ?? String(amountRangeTo))
    : String(amountRangeTo);
  return `${fromLabel} – ${toLabel}`;
}

export function formatChargeAmountDisplay(
  charge: ChargeAmountLike,
  fallbackCurrencyCode?: string
): string {
  if (charge.useChargeTiers) {
    return 'Tiered';
  }
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

/**
 * Review/preview label for a product charge, using an optional product-level amount override.
 * When overridden: `Name · <override amount> (overridden)`.
 */
export function productChargePreviewLabelById(
  options: ChargeAmountLike[] | undefined,
  id: number | undefined,
  chargeAmounts: Record<string, number> | undefined,
  fallbackCurrencyCode?: string
): string {
  if (id == null) {
    return '—';
  }
  const match = options?.find((option) => option.id === id);
  if (!match) {
    return String(id);
  }
  const override = chargeAmounts?.[String(id)];
  if (
    override != null &&
    Number.isFinite(override) &&
    override > 0 &&
    match.useChargeTiers !== true
  ) {
    return `${formatProductChargeOptionLabel(
      { ...match, amount: override },
      fallbackCurrencyCode
    )} (overridden)`;
  }
  return formatProductChargeOptionLabel(match, fallbackCurrencyCode);
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
