/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CHECKER_INBOX_LIST_PATH = '/checker-inbox-and-tasks/checker-inbox';

export function checkerInboxDetailPath(id: string | number) {
  return `${CHECKER_INBOX_LIST_PATH}/${id}`;
}

export function checkerInboxListPath(filters?: {
  loanId?: number | string;
  clientId?: number | string;
  resourceId?: number | string;
}) {
  if (!filters) {
    return CHECKER_INBOX_LIST_PATH;
  }

  const params = new URLSearchParams();
  if (filters.loanId != null) {
    params.set('loanId', String(filters.loanId));
  }
  if (filters.clientId != null) {
    params.set('clientId', String(filters.clientId));
  }
  if (filters.resourceId != null) {
    params.set('resourceId', String(filters.resourceId));
  }

  const query = params.toString();
  return query ? `${CHECKER_INBOX_LIST_PATH}?${query}` : CHECKER_INBOX_LIST_PATH;
}
