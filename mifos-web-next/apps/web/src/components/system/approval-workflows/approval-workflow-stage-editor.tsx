'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRoleListItem, WorkflowApprovalAction } from '@mifos/api-client';
import { workflowStageSchema, type WorkflowStageInput } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  WORKFLOW_EXPIRY_UNIT_SELECT_OPTIONS,
  WORKFLOW_REJECTION_POLICY_SELECT_OPTIONS,
  WORKFLOW_STAGE_TYPE_SELECT_OPTIONS,
  resolveWorkflowStageRoleName,
  workflowRoleSelectOptions,
  workflowStageCheckerPermissionCode,
  workflowStageCodeSelectOptions
} from '@/lib/fineract/approval-workflow-display';

export const WORKFLOW_ACTIONS: WorkflowApprovalAction[] = ['APPROVE', 'REJECT', 'RETURN', 'ESCALATE'];

export function emptyStage(index: number): WorkflowStageInput {
  return {
    stageCode: `STAGE_${index + 1}`,
    name: '',
    stageType: 'APPROVAL',
    requiredApprovals: 1,
    rejectionPolicy: 'ANY',
    rejectionThreshold: null,
    expiryPeriodUnit: null,
    expiryPeriodValue: null,
    escalationEnabled: false,
    escalationTargetStageCode: null,
    allowCrossBranchAccess: false,
    requireDistinctApprover: true,
    roleId: null,
    actions: ['APPROVE', 'REJECT']
  };
}

export function stageHasFieldErrors(
  stageIndex: number,
  fieldErrors: Record<string, string>
): boolean {
  const prefix = `stages.${stageIndex}`;
  return Object.keys(fieldErrors).some((key) => key === prefix || key.startsWith(`${prefix}.`));
}

export function StageSummaryCard({
  stage,
  stageIndex,
  roles,
  hasErrors,
  disabled,
  onEdit,
  onRemove,
  canRemove
}: {
  stage: WorkflowStageInput;
  stageIndex: number;
  roles: FineractRoleListItem[];
  hasErrors: boolean;
  disabled: boolean;
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const title = stage.name?.trim() || stage.stageCode.trim() || `Stage ${stageIndex + 1}`;
  const roleName = resolveWorkflowStageRoleName(stage.roleId, roles);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border bg-card px-4 py-3 ${
        hasErrors ? 'border-destructive/50' : 'border-border'
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="-m-1 flex min-w-0 flex-1 items-start gap-3 rounded-md p-1 text-left hover:bg-muted/40"
      >
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background text-xs font-semibold text-primary">
          {stageIndex + 1}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{title}</span>
            <Badge variant="outline">{stage.stageType}</Badge>
            {hasErrors ? <Badge variant="destructive">Needs attention</Badge> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {stage.stageCode.trim() ? (
              <span className="font-mono">{stage.stageCode}</span>
            ) : (
              <span>No stage code</span>
            )}
            <span>
              {stage.requiredApprovals} approval{stage.requiredApprovals === 1 ? '' : 's'}
            </span>
            <span>{roleName ? `Role: ${roleName}` : 'Any checker'}</span>
            {stage.escalationEnabled ? <span>Escalation on</span> : null}
          </div>
          {stage.actions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stage.actions.map((action) => (
                <Badge key={action} variant="secondary" className="text-[10px]">
                  {action}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Edit ${title}`}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
        </Button>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            disabled={disabled}
            aria-label={`Remove ${title}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function validateStageDraft(
  draft: WorkflowStageInput,
  otherStageCodes: string[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  const result = workflowStageSchema.safeParse(draft);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path.map(String).join('.') || 'stageCode';
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }
  if (draft.escalationEnabled && draft.escalationTargetStageCode?.trim()) {
    if (!otherStageCodes.includes(draft.escalationTargetStageCode.trim())) {
      errors.escalationTargetStageCode = 'Escalation target must match a defined stage code.';
    }
  }
  return errors;
}

export function StageFormSheet({
  open,
  onOpenChange,
  stage,
  stageIndex,
  otherStages,
  roles,
  taskPermissionCode,
  submitLoading = false,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing stage to edit; undefined when adding. */
  stage?: WorkflowStageInput;
  /** Index used to seed a new stage code when adding. */
  stageIndex: number;
  /** All other stages (used for escalation-target options and validation). */
  otherStages: WorkflowStageInput[];
  roles: FineractRoleListItem[];
  taskPermissionCode?: string;
  submitLoading?: boolean;
  onSave: (stage: WorkflowStageInput) => void;
}) {
  const [draft, setDraft] = useState<WorkflowStageInput>(() => stage ?? emptyStage(stageIndex));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEdit = stage != null;
  const checkerPermission = workflowStageCheckerPermissionCode(taskPermissionCode ?? '');

  useEffect(() => {
    if (open) {
      setDraft(stage ?? emptyStage(stageIndex));
      setFieldErrors({});
    }
  }, [open, stage, stageIndex]);

  const escalationStageOptions = useMemo(
    () => workflowStageCodeSelectOptions(otherStages, { excludeStageCode: draft.stageCode }),
    [otherStages, draft.stageCode]
  );
  const roleOptions = useMemo(
    () => [
      { value: '', label: 'Any checker for this task' },
      ...workflowRoleSelectOptions(roles)
    ],
    [roles]
  );

  function patchStage(patch: Partial<WorkflowStageInput>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleAction(action: WorkflowApprovalAction, checked: boolean) {
    setDraft((current) => ({
      ...current,
      actions: checked
        ? [...new Set([...current.actions, action])]
        : current.actions.filter((item) => item !== action)
    }));
  }

  function handleSubmit() {
    const otherStageCodes = otherStages
      .map((item) => item.stageCode.trim())
      .filter(Boolean);
    const errors = validateStageDraft(draft, otherStageCodes);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${draft.name?.trim() || draft.stageCode}` : 'Add intermediate stage'}
      description="Actors need the task checker permission. Optionally restrict this stage to members of one role."
      submitLabel="Save stage"
      onSubmit={handleSubmit}
      submitLoading={submitLoading}
      className="data-[side=right]:sm:max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Stage code"
            required
            value={draft.stageCode}
            onChange={(value) => patchStage({ stageCode: value })}
            error={fieldErrors.stageCode}
          />
          <TextField
            label="Display name"
            value={draft.name ?? ''}
            onChange={(value) => patchStage({ name: value })}
          />
          <SelectField
            id="stage-stageType"
            label="Stage type"
            value={draft.stageType}
            onValueChange={(value) =>
              value && patchStage({ stageType: value as WorkflowStageInput['stageType'] })
            }
            options={WORKFLOW_STAGE_TYPE_SELECT_OPTIONS}
          />
          <TextField
            label="Required approvals"
            required
            type="number"
            value={String(draft.requiredApprovals)}
            onChange={(value) => patchStage({ requiredApprovals: Number(value) || 1 })}
            error={fieldErrors.requiredApprovals}
          />
          <SelectField
            id="stage-roleId"
            className="sm:col-span-2"
            label="Restricting role"
            optional
            value={draft.roleId == null ? '' : String(draft.roleId)}
            onValueChange={(value) =>
              patchStage({ roleId: value ? Number(value) : null })
            }
            options={roleOptions}
            placeholder="Any checker for this task"
            emptyMessage="No active roles found."
            error={fieldErrors.roleId}
            listClassName="max-h-72"
          />
          <SelectField
            id="stage-rejectionPolicy"
            label="Rejection policy"
            value={draft.rejectionPolicy ?? 'ANY'}
            onValueChange={(value) =>
              value &&
              patchStage({
                rejectionPolicy: value as WorkflowStageInput['rejectionPolicy'],
                rejectionThreshold: value === 'THRESHOLD' ? draft.rejectionThreshold : null
              })
            }
            options={WORKFLOW_REJECTION_POLICY_SELECT_OPTIONS}
          />
          {draft.rejectionPolicy === 'THRESHOLD' ? (
            <TextField
              label="Rejection threshold"
              type="number"
              value={draft.rejectionThreshold == null ? '' : String(draft.rejectionThreshold)}
              onChange={(value) =>
                patchStage({ rejectionThreshold: value === '' ? null : Number(value) })
              }
              error={fieldErrors.rejectionThreshold}
            />
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="stage-escalation"
              checked={draft.escalationEnabled ?? false}
              onCheckedChange={(checked) => patchStage({ escalationEnabled: checked === true })}
            />
            <Label htmlFor="stage-escalation">Escalation enabled</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="stage-distinct"
              checked={draft.requireDistinctApprover ?? true}
              onCheckedChange={(checked) => patchStage({ requireDistinctApprover: checked === true })}
            />
            <Label htmlFor="stage-distinct">Require distinct approver</Label>
          </div>
        </div>

        {draft.escalationEnabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="stage-expiryUnit"
              label="Expiry unit"
              value={draft.expiryPeriodUnit ?? ''}
              onValueChange={(value) =>
                value &&
                patchStage({ expiryPeriodUnit: value as WorkflowStageInput['expiryPeriodUnit'] })
              }
              options={WORKFLOW_EXPIRY_UNIT_SELECT_OPTIONS}
              placeholder="Select unit"
              error={fieldErrors.expiryPeriodUnit}
            />
            <TextField
              label="Expiry value"
              type="number"
              value={draft.expiryPeriodValue == null ? '' : String(draft.expiryPeriodValue)}
              onChange={(value) =>
                patchStage({ expiryPeriodValue: value === '' ? null : Number(value) })
              }
              error={fieldErrors.expiryPeriodValue}
            />
            <SelectField
              id="stage-escalationTarget"
              className="sm:col-span-2"
              label="Escalation target stage"
              value={draft.escalationTargetStageCode ?? ''}
              onValueChange={(value) => patchStage({ escalationTargetStageCode: value ?? null })}
              options={escalationStageOptions}
              placeholder="Select stage"
              error={fieldErrors.escalationTargetStageCode}
            />
          </div>
        ) : null}

        <div>
          <Label className="mb-2 block">Enabled actions</Label>
          <div className="flex flex-wrap gap-4">
            {WORKFLOW_ACTIONS.map((action) => (
              <div key={action} className="flex items-center gap-2">
                <Checkbox
                  id={`stage-action-${action}`}
                  checked={draft.actions.includes(action)}
                  onCheckedChange={(checked) => toggleAction(action, checked === true)}
                />
                <Label htmlFor={`stage-action-${action}`}>{action}</Label>
              </div>
            ))}
          </div>
          {fieldErrors.actions ? (
            <p className="mt-1 text-sm text-destructive">{fieldErrors.actions}</p>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          Actors need{' '}
          {checkerPermission ? (
            <span className="font-medium text-foreground">{checkerPermission}</span>
          ) : (
            <span className="font-medium text-foreground">{'{task}_CHECKER'}</span>
          )}
          {draft.roleId != null
            ? ', and must also hold the selected role.'
            : '. Leave role empty to allow any checker for this task.'}
        </p>
      </div>
    </FormSheet>
  );
}
