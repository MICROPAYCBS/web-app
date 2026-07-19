/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ADHOC_QUERY_LIST_PATH = '/organization/adhoc-query';

export function adhocQueryDetailPath(adhocQueryId: string | number) {
  return `${ADHOC_QUERY_LIST_PATH}/${adhocQueryId}`;
}

export function adhocQueryEditPath(adhocQueryId: string | number) {
  return `${ADHOC_QUERY_LIST_PATH}/${adhocQueryId}/edit`;
}

export function adhocQueryCreatePath() {
  return `${ADHOC_QUERY_LIST_PATH}/create`;
}
