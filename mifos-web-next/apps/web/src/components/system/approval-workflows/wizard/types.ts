/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRoleListItem, FineractRolePermissionUsage } from '@mifos/api-client';
import type { UpsertWorkflowDefinitionInput } from '@mifos/validation';

export type StepErrors = Record<string, string>;

export type ApprovalWorkflowWizardMode = 'create' | 'edit';

export interface ApprovalWorkflowWizardProps {
  mode?: ApprovalWorkflowWizardMode;
  definitionId?: number;
  /** Used for the edit wizard title when mode is `edit`. */
  workflowName?: string;
  initialValues: UpsertWorkflowDefinitionInput;
  taskPermissions: FineractRolePermissionUsage[];
  roles: FineractRoleListItem[];
}

export interface WorkflowStepProps {
  draft: UpsertWorkflowDefinitionInput;
  taskPermissions: FineractRolePermissionUsage[];
  roles: FineractRoleListItem[];
  errors: StepErrors;
  disabled?: boolean;
  onChange: (patch: Partial<UpsertWorkflowDefinitionInput>) => void;
}
