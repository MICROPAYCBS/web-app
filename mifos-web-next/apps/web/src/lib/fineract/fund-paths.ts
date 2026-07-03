/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const FUND_LIST_PATH = '/organization/manage-funds';

export function fundCreatePath(): string {
  return `${FUND_LIST_PATH}?create=1`;
}

export function fundEditPath(fundId: string | number): string {
  return `${FUND_LIST_PATH}?edit=${fundId}`;
}

export function fundDetailPath(fundId: string | number): string {
  return `${FUND_LIST_PATH}/${fundId}`;
}

/** Legacy web-app edit route — redirects to the list with edit side panel. */
export function fundLegacyEditPath(fundId: string | number): string {
  return `${FUND_LIST_PATH}/${fundId}/edit`;
}
