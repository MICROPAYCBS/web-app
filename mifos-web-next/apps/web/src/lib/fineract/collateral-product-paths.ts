/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const COLLATERAL_PRODUCTS_LIST_PATH = '/products/collaterals';

export function collateralProductListPath(): string {
  return COLLATERAL_PRODUCTS_LIST_PATH;
}

export function collateralProductDetailPath(collateralId: string | number): string {
  return `${COLLATERAL_PRODUCTS_LIST_PATH}/${collateralId}`;
}

export function collateralProductCreatePath(): string {
  return `${COLLATERAL_PRODUCTS_LIST_PATH}?create=1`;
}

export function collateralProductEditPath(collateralId: string | number): string {
  return `${collateralProductDetailPath(collateralId)}?edit=1`;
}
