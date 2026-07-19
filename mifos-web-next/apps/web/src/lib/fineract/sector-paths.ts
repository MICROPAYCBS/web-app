/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SECTOR_LIST_PATH = '/organization/sectors';

export function sectorCreatePath(): string {
  return `${SECTOR_LIST_PATH}?create=1`;
}

export function sectorEditPath(sectorId: string | number): string {
  return `${SECTOR_LIST_PATH}?edit=${sectorId}`;
}
