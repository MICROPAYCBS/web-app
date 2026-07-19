/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const PROVISIONING_CRITERIA_LIST_PATH = '/organization/provisioning-criteria';

export function provisioningCriteriaDetailPath(criteriaId: string | number) {
  return `${PROVISIONING_CRITERIA_LIST_PATH}/${criteriaId}`;
}

export function provisioningCriteriaEditPath(criteriaId: string | number) {
  return `${PROVISIONING_CRITERIA_LIST_PATH}/${criteriaId}/edit`;
}

export function provisioningCriteriaCreatePath() {
  return `${PROVISIONING_CRITERIA_LIST_PATH}/create`;
}
