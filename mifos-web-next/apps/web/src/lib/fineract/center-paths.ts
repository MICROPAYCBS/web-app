/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CENTERS_LIST_PATH = '/centers';

export function centerDetailPath(centerId: string | number) {
  return `${CENTERS_LIST_PATH}/${centerId}`;
}

export function centerGeneralPath(centerId: string | number) {
  return `${centerDetailPath(centerId)}/general`;
}

export function centerCreatePath() {
  return `${CENTERS_LIST_PATH}/create`;
}

export function centerEditPath(centerId: string | number) {
  return `${centerDetailPath(centerId)}/edit`;
}
