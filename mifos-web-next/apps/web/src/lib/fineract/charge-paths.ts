/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CHARGES_LIST_PATH = '/products/charges';

export function chargeListPath(): string {
  return CHARGES_LIST_PATH;
}

export function chargeDetailPath(chargeId: string | number): string {
  return `${CHARGES_LIST_PATH}/${chargeId}`;
}

export function chargeCreatePath(): string {
  return `${CHARGES_LIST_PATH}/create`;
}

export function chargeEditPath(chargeId: string | number): string {
  return `${chargeDetailPath(chargeId)}/edit`;
}
