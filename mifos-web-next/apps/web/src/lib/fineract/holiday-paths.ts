/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const HOLIDAY_LIST_PATH = '/organization/holidays';

export function holidayDetailPath(holidayId: string | number) {
  return `${HOLIDAY_LIST_PATH}/${holidayId}`;
}

export function holidayEditPath(holidayId: string | number) {
  return `${HOLIDAY_LIST_PATH}/${holidayId}/edit`;
}

export function holidayCreatePath() {
  return `${HOLIDAY_LIST_PATH}/create`;
}
