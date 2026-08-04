/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractRoleListItem,
  FineractRolePermissionUsage,
  WorkflowDefinition,
  WorkflowDefinitionStatus
} from '@mifos/api-client';
import type { UpsertWorkflowDefinitionInput } from '@mifos/validation';

export type StepErrors = Record<string, string>;

export type ApprovalWorkflowWizardMode = 'create' | 'edit';

export type WorkflowDefinitionPeer = Pick<
  WorkflowDefinition,
  'id' | 'name' | 'status' | 'taskPermissionCode'
>;

export interface ApprovalWorkflowWizardProps {
  mode?: ApprovalWorkflowWizardMode;
  definitionId?: number;
  /** Used for the edit wizard title when mode is `edit`. */
  workflowName?: string;
  /** Status of the definition being edited (`DRAFT` / `ACTIVE` / `INACTIVE`). */
  definitionStatus?: WorkflowDefinitionStatus;
  initialValues: UpsertWorkflowDefinitionInput;
  taskPermissions: FineractRolePermissionUsage[];
  roles: FineractRoleListItem[];
  /** Existing definitions used to warn when the task already has an ACTIVE workflow. */
  existingDefinitions?: WorkflowDefinitionPeer[];
}

export interface WorkflowStepProps {
  draft: UpsertWorkflowDefinitionInput;
  taskPermissions: FineractRolePermissionUsage[];
  roles: FineractRoleListItem[];
  errors: StepErrors;
  disabled?: boolean;
  definitionId?: number;
  existingDefinitions?: WorkflowDefinitionPeer[];
  onChange: (patch: Partial<UpsertWorkflowDefinitionInput>) => void;
}
