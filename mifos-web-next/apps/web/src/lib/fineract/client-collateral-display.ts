/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientCollateralListItem, CollateralProductDetail } from '@mifos/api-client';

/** Total value = Fineract `total` or basePrice × quantity. */
export function clientCollateralTotalValue(
  item: Pick<ClientCollateralListItem, 'basePrice' | 'quantity' | 'total'>
): number | undefined {
  if (item.total !== undefined) {
    return item.total;
  }
  if (item.basePrice === undefined || item.quantity === undefined) {
    return undefined;
  }
  return item.basePrice * item.quantity;
}

/** Total collateral value = Fineract `totalCollateral` or derived from pct/base/qty. */
export function clientCollateralTotalCollateralValue(
  item: Pick<
    ClientCollateralListItem,
    'basePrice' | 'pctToBase' | 'quantity' | 'total' | 'totalCollateral'
  >
): number | undefined {
  if (item.totalCollateral !== undefined) {
    return item.totalCollateral;
  }
  const total = clientCollateralTotalValue(item);
  if (total === undefined || item.pctToBase === undefined) {
    return undefined;
  }
  return (item.pctToBase * total) / 100;
}

/** Build a list row after create using product details + new link id. */
export function buildClientCollateralListItem(
  product: CollateralProductDetail,
  clientCollateralId: number,
  quantity: number
): ClientCollateralListItem {
  const total =
    product.basePrice !== undefined ? product.basePrice * quantity : undefined;
  const totalCollateral =
    total !== undefined && product.pctToBase !== undefined
      ? (product.pctToBase * total) / 100
      : undefined;
  return {
    id: clientCollateralId,
    collateralId: product.id,
    name: product.name,
    quantity,
    basePrice: product.basePrice,
    pctToBase: product.pctToBase,
    total,
    totalCollateral,
    currency: product.currency
  };
}
