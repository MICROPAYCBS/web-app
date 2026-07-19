/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CHECKER_INBOX_LIST_PATH = '/checker-inbox-and-tasks/checker-inbox';

/** Requests from others that need checking (default). */
export const CHECKER_INBOX_TAB_TO_REVIEW = 'to-review';
/** Requests the signed-in user submitted — status tracking, not self-check. */
export const CHECKER_INBOX_TAB_MY_SUBMISSIONS = 'my-submissions';

export type CheckerInboxTab =
  | typeof CHECKER_INBOX_TAB_TO_REVIEW
  | typeof CHECKER_INBOX_TAB_MY_SUBMISSIONS;

export function parseCheckerInboxTab(value: string | undefined): CheckerInboxTab {
  return value === CHECKER_INBOX_TAB_MY_SUBMISSIONS
    ? CHECKER_INBOX_TAB_MY_SUBMISSIONS
    : CHECKER_INBOX_TAB_TO_REVIEW;
}

export function checkerInboxDetailPath(id: string | number) {
  return `${CHECKER_INBOX_LIST_PATH}/${id}`;
}

export function checkerInboxListPath(filters?: {
  loanId?: number | string;
  clientId?: number | string;
  resourceId?: number | string;
  tab?: CheckerInboxTab;
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
  if (filters.tab && filters.tab !== CHECKER_INBOX_TAB_TO_REVIEW) {
    params.set('tab', filters.tab);
  }

  const query = params.toString();
  return query ? `${CHECKER_INBOX_LIST_PATH}?${query}` : CHECKER_INBOX_LIST_PATH;
}
