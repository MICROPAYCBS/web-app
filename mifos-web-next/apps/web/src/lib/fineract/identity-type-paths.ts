/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const IDENTITY_TYPE_LIST_PATH = '/organization/identity-types';

export function identityTypeCreatePath(): string {
  return `${IDENTITY_TYPE_LIST_PATH}?create=1`;
}

export function identityTypeEditPath(identityTypeId: string | number): string {
  return `${IDENTITY_TYPE_LIST_PATH}?edit=${identityTypeId}`;
}
