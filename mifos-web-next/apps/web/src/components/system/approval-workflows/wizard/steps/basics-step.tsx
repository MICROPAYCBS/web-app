'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Badge } from '@/components/ui/badge';
import {
  CONFIGURE_MC_TASKS_PATH,
  findActiveWorkflowPeer,
  findWorkflowTaskPermission,
  workflowTaskPermissionSelectOptions
} from '@/lib/fineract/approval-workflow-display';
import { approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import type { WorkflowStepProps } from '../types';

export function BasicsStep({
  draft,
  taskPermissions,
  errors,
  disabled,
  definitionId,
  existingDefinitions = [],
  onChange
}: WorkflowStepProps) {
  const taskOptions = useMemo(
    () => workflowTaskPermissionSelectOptions(taskPermissions),
    [taskPermissions]
  );
  const selectedTask = findWorkflowTaskPermission(taskPermissions, draft.taskPermissionCode);
  const activePeer = findActiveWorkflowPeer(
    existingDefinitions,
    draft.taskPermissionCode,
    definitionId
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the maker-checker task this workflow applies to, then name it for your team.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="taskPermissionCode"
          label="Task"
          required
          value={draft.taskPermissionCode}
          onValueChange={(value) => onChange({ taskPermissionCode: value ?? '' })}
          options={taskOptions}
          placeholder="Select a maker-checker task"
          disabled={disabled}
          error={errors.taskPermissionCode}
          emptyMessage="No maker-checker tasks found."
          listClassName="max-h-72"
        />
        {selectedTask && !selectedTask.selected ? (
          <p className="md:col-span-2 text-sm text-muted-foreground">
            Maker-checker is off for this task.{' '}
            <Link
              href={CONFIGURE_MC_TASKS_PATH}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Enable it
            </Link>{' '}
            before you can activate this workflow.
          </p>
        ) : selectedTask?.selected ? (
          <div className="md:col-span-2">
            <Badge variant="secondary">Maker-checker enabled</Badge>
          </div>
        ) : null}
        {activePeer ? (
          <p className="md:col-span-2 text-sm text-muted-foreground">
            This task already has an active workflow (
            <Link
              href={approvalWorkflowDetailPath(activePeer.id)}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {activePeer.name}
            </Link>
            ). Only one active workflow is allowed per task — deactivate it before activating this
            one.
          </p>
        ) : null}
        <TextField
          label="Name"
          required
          value={draft.name}
          onChange={(value) => onChange({ name: value })}
          disabled={disabled}
          error={errors.name}
        />
        <TextField
          label="Priority"
          optional
          type="number"
          value={draft.priority == null ? '' : String(draft.priority)}
          onChange={(value) => onChange({ priority: value === '' ? null : Number(value) })}
          disabled={disabled}
        />
        <TextField
          label="Description"
          optional
          value={draft.description ?? ''}
          onChange={(value) => onChange({ description: value })}
          disabled={disabled}
          className="md:col-span-2"
        />
      </div>
    </div>
  );
}
