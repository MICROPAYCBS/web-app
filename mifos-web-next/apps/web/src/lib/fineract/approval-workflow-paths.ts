/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const APPROVAL_WORKFLOWS_LIST_PATH = '/system/approval-workflows';
export const ENABLE_APPROVAL_WORKFLOWS_CONFIG_NAME = 'enable-approval-workflows';

export function approvalWorkflowDetailPath(definitionId: number | string) {
  return `${APPROVAL_WORKFLOWS_LIST_PATH}/${definitionId}`;
}

export function approvalWorkflowEditPath(definitionId: number | string) {
  return `${approvalWorkflowDetailPath(definitionId)}/edit`;
}

export function approvalWorkflowCreatePath() {
  return `${APPROVAL_WORKFLOWS_LIST_PATH}/create`;
}
