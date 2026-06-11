/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const PAYMENT_TYPE_LIST_PATH = '/organization/payment-types';

export function paymentTypeCreatePath(): string {
  return `${PAYMENT_TYPE_LIST_PATH}/create`;
}

export function paymentTypeEditPath(paymentTypeId: string | number): string {
  return `${PAYMENT_TYPE_LIST_PATH}/${paymentTypeId}/edit`;
}
