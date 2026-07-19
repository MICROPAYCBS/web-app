/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const PRODUCT_MIX_LIST_PATH = '/products/products-mix';

export function productMixListPath(): string {
  return PRODUCT_MIX_LIST_PATH;
}

export function productMixDetailPath(productId: string | number): string {
  return `${PRODUCT_MIX_LIST_PATH}/${productId}`;
}

export function productMixCreatePath(): string {
  return `${PRODUCT_MIX_LIST_PATH}?create=1`;
}

export function productMixEditPath(productId: string | number): string {
  return `${productMixDetailPath(productId)}?edit=1`;
}
