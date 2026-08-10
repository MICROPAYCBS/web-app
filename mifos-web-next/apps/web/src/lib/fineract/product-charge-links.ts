/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type ProductChargeAmounts = Record<string, number>;

export type ProductChargeLinkOption = {
  id?: number;
  amount?: number;
  useChargeTiers?: boolean;
};

export type ProductChargeLinkRow = {
  id?: number;
  amount?: number;
};

/** API payload rows: `{ id }` or `{ id, amount }` when a product override is set. */
export function buildProductChargesPayload(
  chargeIds: number[],
  chargeAmounts?: ProductChargeAmounts
): Array<{ id: number; amount?: number }> {
  return chargeIds.map((id) => {
    const override = chargeAmounts?.[String(id)];
    if (override != null && Number.isFinite(override) && override > 0) {
      return { id, amount: override };
    }
    return { id };
  });
}

export function pruneProductChargeAmounts(
  chargeIds: number[],
  chargeAmounts: ProductChargeAmounts | undefined
): ProductChargeAmounts {
  const selected = new Set(chargeIds.map(String));
  const next: ProductChargeAmounts = {};
  for (const [key, value] of Object.entries(chargeAmounts ?? {})) {
    if (selected.has(key) && value != null && Number.isFinite(value) && value > 0) {
      next[key] = value;
    }
  }
  return next;
}

/**
 * Prefill optional override amounts when the product’s effective charge amount
 * differs from the charge-definition amount (product GET uses COALESCE).
 */
export function productChargeAmountsFromTemplate(
  productCharges: ProductChargeLinkRow[] | undefined,
  chargeOptions: ProductChargeLinkOption[] | undefined,
  penaltyOptions?: ProductChargeLinkOption[]
): ProductChargeAmounts {
  const optionsById = new Map<number, ProductChargeLinkOption>();
  for (const option of [...(chargeOptions ?? []), ...(penaltyOptions ?? [])]) {
    if (option.id != null && Number.isFinite(option.id)) {
      optionsById.set(option.id, option);
    }
  }

  const amounts: ProductChargeAmounts = {};
  for (const charge of productCharges ?? []) {
    if (charge.id == null || !Number.isFinite(charge.id) || charge.amount == null) {
      continue;
    }
    const option = optionsById.get(charge.id);
    if (option?.useChargeTiers) {
      continue;
    }
    const definitionAmount = option?.amount;
    if (definitionAmount == null || Number(charge.amount) !== Number(definitionAmount)) {
      amounts[String(charge.id)] = Number(charge.amount);
    }
  }
  return amounts;
}
