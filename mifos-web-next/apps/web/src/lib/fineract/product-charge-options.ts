/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeAmountLike } from '@/lib/fineract/charge-display';

export type ProductChargeOption = ChargeAmountLike & { id?: number };

export function chargeOptionCurrencyCode(option: ProductChargeOption): string | undefined {
  const code = option.currency?.code ?? option.currencyCode;
  return code?.trim().toUpperCase() || undefined;
}

export function filterChargeOptionsByCurrency<T extends ProductChargeOption>(
  options: T[] | undefined,
  currencyCode: string | undefined
): T[] {
  const code = currencyCode?.trim().toUpperCase();
  if (!code) {
    return [];
  }
  return (options ?? []).filter((option) => chargeOptionCurrencyCode(option) === code);
}

export type FilteredProductChargeOptions = {
  chargeOptions: ProductChargeOption[];
  penaltyOptions: ProductChargeOption[];
};

export function filterProductChargeOptions(
  chargeOptions: ProductChargeOption[] | undefined,
  penaltyOptions: ProductChargeOption[] | undefined,
  currencyCode: string
): FilteredProductChargeOptions {
  return {
    chargeOptions: filterChargeOptionsByCurrency(chargeOptions, currencyCode),
    penaltyOptions: filterChargeOptionsByCurrency(penaltyOptions, currencyCode)
  };
}

export const PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR = 'Could not load charge options.';

export type ProductChargeOptionsFetchResult =
  | { ok: true; chargeOptions?: { id?: number }[]; penaltyOptions?: { id?: number }[] }
  | { ok: false; message?: string };

export type InterpretedProductChargeOptions =
  | { ok: true; chargeOptions?: { id?: number }[]; penaltyOptions?: { id?: number }[] }
  | { ok: false; message: string };

/** Failed fetches must not look like an empty option list. */
export function interpretProductChargeOptionsResult(
  result: ProductChargeOptionsFetchResult
): InterpretedProductChargeOptions {
  if (result.ok) {
    return {
      ok: true,
      chargeOptions: result.chargeOptions,
      penaltyOptions: result.penaltyOptions
    };
  }
  return {
    ok: false,
    message: result.message?.trim() || PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR
  };
}

export function pruneProductChargeIds(
  chargeIds: number[],
  chargeOptions: { id?: number }[] | undefined,
  penaltyOptions: { id?: number }[] | undefined
): number[] {
  const validIds = new Set<number>();
  for (const option of chargeOptions ?? []) {
    if (option.id != null && Number.isFinite(option.id)) {
      validIds.add(option.id);
    }
  }
  for (const option of penaltyOptions ?? []) {
    if (option.id != null && Number.isFinite(option.id)) {
      validIds.add(option.id);
    }
  }
  return chargeIds.filter((id) => validIds.has(id));
}

type TemplateWithChargeOptions = {
  chargeOptions?: ProductChargeOption[];
  penaltyOptions?: ProductChargeOption[];
  currencyCode?: string;
  currency?: { code?: string };
};

export function filterTemplateChargeOptionsByCurrency<T extends TemplateWithChargeOptions>(
  template: T
): T {
  const currencyCode = template.currencyCode ?? template.currency?.code;
  if (!currencyCode?.trim()) {
    return {
      ...template,
      chargeOptions: [],
      penaltyOptions: []
    };
  }

  const { chargeOptions, penaltyOptions } = filterProductChargeOptions(
    template.chargeOptions,
    template.penaltyOptions,
    currencyCode
  );

  return {
    ...template,
    chargeOptions,
    penaltyOptions
  };
}
