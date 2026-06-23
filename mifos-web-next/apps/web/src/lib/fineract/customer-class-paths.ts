/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CUSTOMER_CLASS_LIST_PATH = '/organization/customer-classes';

export function customerClassCreatePath(): string {
  return `${CUSTOMER_CLASS_LIST_PATH}?create=1`;
}

export function customerClassEditPath(customerClassId: string | number): string {
  return `${CUSTOMER_CLASS_LIST_PATH}?edit=${customerClassId}`;
}

export function customerClassLegacyEditPath(customerClassId: string | number): string {
  return `${CUSTOMER_CLASS_LIST_PATH}/${customerClassId}/edit`;
}
