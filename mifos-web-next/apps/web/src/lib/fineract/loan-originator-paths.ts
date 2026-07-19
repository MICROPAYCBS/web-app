/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const LOAN_ORIGINATOR_LIST_PATH = '/organization/manage-loan-originators';

export function loanOriginatorDetailPath(loanOriginatorId: string | number) {
  return `${LOAN_ORIGINATOR_LIST_PATH}/${loanOriginatorId}`;
}

export function loanOriginatorCreatePath() {
  return `${LOAN_ORIGINATOR_LIST_PATH}?create=1`;
}

export function loanOriginatorDetailEditPath(loanOriginatorId: string | number) {
  return `${loanOriginatorDetailPath(loanOriginatorId)}?edit=1`;
}

/** Legacy web-app edit route — redirects to detail with edit side panel. */
export function loanOriginatorLegacyEditPath(loanOriginatorId: string | number) {
  return `${LOAN_ORIGINATOR_LIST_PATH}/${loanOriginatorId}/edit`;
}
