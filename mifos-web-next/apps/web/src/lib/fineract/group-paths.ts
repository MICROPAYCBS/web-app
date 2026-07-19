/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const GROUPS_LIST_PATH = '/groups';

export function groupDetailPath(groupId: string | number) {
  return `${GROUPS_LIST_PATH}/${groupId}`;
}

export function groupGeneralPath(groupId: string | number) {
  return `${groupDetailPath(groupId)}/general`;
}

export function groupCreatePath() {
  return `${GROUPS_LIST_PATH}/create`;
}

export function groupEditPath(groupId: string | number) {
  return `${groupDetailPath(groupId)}/edit`;
}
