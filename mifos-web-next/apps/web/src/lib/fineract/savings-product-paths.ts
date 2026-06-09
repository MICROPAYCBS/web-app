/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SAVINGS_PRODUCTS_API_PATH = '/savingsproducts';
export const SAVINGS_PRODUCTS_LIST_PATH = '/products/savings-products';

export function savingsProductDetailPath(productId: string | number): string {
  return `${SAVINGS_PRODUCTS_LIST_PATH}/${productId}`;
}

export function savingsProductCreatePath(): string {
  return `${SAVINGS_PRODUCTS_LIST_PATH}/create`;
}

export function savingsProductEditPath(productId: string | number): string {
  return `${SAVINGS_PRODUCTS_LIST_PATH}/${productId}/edit`;
}
