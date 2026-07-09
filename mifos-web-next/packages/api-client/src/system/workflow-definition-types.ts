/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type WorkflowDefinitionStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export type WorkflowStageType = 'REVIEW' | 'APPROVAL' | 'VERIFICATION';

export type WorkflowRejectionPolicy = 'ANY' | 'ALL' | 'THRESHOLD';

export type WorkflowExpiryPeriodUnit = 'HOURS' | 'DAYS';

export type WorkflowApprovalAction = 'APPROVE' | 'REJECT' | 'RETURN' | 'ESCALATE';

export interface WorkflowStage {
  id?: number;
  stageCode: string;
  name?: string;
  stageType: WorkflowStageType;
  requiredApprovals: number;
  rejectionPolicy?: WorkflowRejectionPolicy | null;
  rejectionThreshold?: number | null;
  expiryPeriodUnit?: WorkflowExpiryPeriodUnit | null;
  expiryPeriodValue?: number | null;
  escalationEnabled?: boolean;
  escalationTargetStageCode?: string | null;
  allowCrossBranchAccess?: boolean;
  requireDistinctApprover?: boolean;
  approvalLimitAmount?: number | null;
  approvalLimitCurrency?: string | null;
  actions: WorkflowApprovalAction[];
}

export interface WorkflowTransition {
  id?: number;
  fromStageCode: string;
  toStageCode: string;
  sequenceNo: number;
  minAmount?: number | null;
  maxAmount?: number | null;
}

export interface WorkflowDefinition {
  id: number;
  taskPermissionCode: string;
  name: string;
  description?: string;
  status: WorkflowDefinitionStatus;
  priority?: number | null;
  currencyCode?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
}

export interface WorkflowDefinitionWritePayload {
  taskPermissionCode: string;
  name: string;
  description?: string;
  priority?: number | null;
  currencyCode?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  stages: Array<{
    stageCode: string;
    name?: string;
    stageType: WorkflowStageType;
    requiredApprovals: number;
    rejectionPolicy?: WorkflowRejectionPolicy | null;
    rejectionThreshold?: number | null;
    expiryPeriodUnit?: WorkflowExpiryPeriodUnit | null;
    expiryPeriodValue?: number | null;
    escalationEnabled?: boolean;
    escalationTargetStageCode?: string | null;
    allowCrossBranchAccess?: boolean;
    requireDistinctApprover?: boolean;
    approvalLimitAmount?: number | null;
    approvalLimitCurrency?: string | null;
    actions: WorkflowApprovalAction[];
  }>;
  transitions: Array<{
    fromStageCode: string;
    toStageCode: string;
    sequenceNo: number;
    minAmount?: number | null;
    maxAmount?: number | null;
  }>;
}
