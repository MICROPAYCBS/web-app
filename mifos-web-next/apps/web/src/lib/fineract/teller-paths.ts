/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const TELLER_LIST_PATH = '/organization/tellers';

export function tellerCreatePath(): string {
  return `${TELLER_LIST_PATH}?create=1`;
}

export function tellerDetailPath(tellerId: string | number): string {
  return `${TELLER_LIST_PATH}/${tellerId}`;
}

export function tellerEditPath(tellerId: string | number): string {
  return `${tellerDetailPath(tellerId)}?edit=1`;
}

export function tellerCashiersPath(tellerId: string | number): string {
  return `${tellerDetailPath(tellerId)}/cashiers`;
}

export function tellerCashierDetailPath(
  tellerId: string | number,
  cashierId: string | number
): string {
  return `${tellerCashiersPath(tellerId)}/${cashierId}`;
}

/** Legacy web-app edit route — redirects to detail with edit side panel. */
export function tellerLegacyEditPath(tellerId: string | number): string {
  return `${tellerDetailPath(tellerId)}/edit`;
}
