/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SHARE_PRODUCTS_API_PATH = '/products/share';
export const SHARE_PRODUCTS_LIST_PATH = '/products/share-products';

export function shareProductDetailPath(productId: string | number): string {
  return `${SHARE_PRODUCTS_LIST_PATH}/${productId}`;
}

export function shareProductCreatePath(): string {
  return `${SHARE_PRODUCTS_LIST_PATH}/create`;
}

export function shareProductEditPath(productId: string | number): string {
  return `${SHARE_PRODUCTS_LIST_PATH}/${productId}/edit`;
}
