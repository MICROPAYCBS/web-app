/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Rough purchase total for client-side balance hints (server is authoritative). */
export function estimateSharePurchaseTotal(input: {
  requestedShares: number;
  unitPrice?: number | null;
  chargeAmounts?: number[];
}): number | null {
  const shares = input.requestedShares;
  const price = input.unitPrice;
  if (!Number.isFinite(shares) || shares <= 0 || price == null || !Number.isFinite(price)) {
    return null;
  }
  const charges = (input.chargeAmounts ?? []).reduce(
    (sum, amount) => sum + (Number.isFinite(amount) ? amount : 0),
    0
  );
  return shares * price + charges;
}

export function sharePurchaseFundingLabel(useSavings: boolean | undefined): string {
  return useSavings === true ? 'Savings' : 'Cash';
}
