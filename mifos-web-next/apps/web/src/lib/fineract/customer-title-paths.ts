/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CUSTOMER_TITLE_LIST_PATH = '/organization/customer-titles';

export function customerTitleCreatePath(): string {
  return `${CUSTOMER_TITLE_LIST_PATH}?create=1`;
}

export function customerTitleEditPath(customerTitleId: string | number): string {
  return `${CUSTOMER_TITLE_LIST_PATH}?edit=${customerTitleId}`;
}
