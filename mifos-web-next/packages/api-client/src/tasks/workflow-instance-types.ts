/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type WorkflowInstanceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'RETURNED';

export interface WorkflowInstance {
  id: number;
  commandSourceId: number;
  workflowDefinitionId: number;
  taskPermissionCode: string;
  currentStageCode: string;
  status: WorkflowInstanceStatus;
  transactionAmount?: number | null;
  currencyCode?: string | null;
}
