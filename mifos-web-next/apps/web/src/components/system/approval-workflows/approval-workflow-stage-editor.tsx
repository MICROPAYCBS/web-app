'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, WorkflowApprovalAction } from '@mifos/api-client';
import type { WorkflowStageInput } from '@mifos/validation';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  WORKFLOW_EXPIRY_UNIT_SELECT_OPTIONS,
  WORKFLOW_REJECTION_POLICY_SELECT_OPTIONS,
  WORKFLOW_STAGE_TYPE_SELECT_OPTIONS,
  workflowCurrencySelectOptions,
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
    approvalLimitAmount: null,
    approvalLimitCurrency: null,
    actions: ['APPROVE', 'REJECT']
  };
}

export function StageEditor({
  stage,
  stageIndex,
  allStages,
  currencies,
  taskPermissionCode,
  disabled,
  fieldErrors,
  onChange,
  onRemove,
  canRemove
}: {
  stage: WorkflowStageInput;
  stageIndex: number;
  allStages: WorkflowStageInput[];
  currencies: FineractCurrencyOption[];
  taskPermissionCode?: string;
  disabled: boolean;
  fieldErrors: Record<string, string>;
  onChange: (stage: WorkflowStageInput) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const prefix = `stages.${stageIndex}`;
  const currencyOptions = useMemo(() => workflowCurrencySelectOptions(currencies), [currencies]);
  const escalationStageOptions = useMemo(
    () => workflowStageCodeSelectOptions(allStages, { excludeStageCode: stage.stageCode }),
    [allStages, stage.stageCode]
  );
  const checkerPermission = workflowStageCheckerPermissionCode(taskPermissionCode ?? '');

  function patchStage(patch: Partial<WorkflowStageInput>) {
    onChange({ ...stage, ...patch });
  }

  function toggleAction(action: WorkflowApprovalAction, checked: boolean) {
    const actions = checked
      ? [...new Set([...stage.actions, action])]
      : stage.actions.filter((item) => item !== action);
    patchStage({ actions });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium">Intermediate stage {stageIndex + 1}</h4>
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
            <Trash2 className="mr-1 size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Stage code"
          required
          value={stage.stageCode}
          onChange={(value) => patchStage({ stageCode: value })}
          disabled={disabled}
          error={fieldErrors[`${prefix}.stageCode`]}
        />
        <TextField
          label="Display name"
          value={stage.name ?? ''}
          onChange={(value) => patchStage({ name: value })}
          disabled={disabled}
        />
        <SelectField
          id={`${prefix}-stageType`}
          label="Stage type"
          value={stage.stageType}
          onValueChange={(value) =>
            value && patchStage({ stageType: value as WorkflowStageInput['stageType'] })
          }
          options={WORKFLOW_STAGE_TYPE_SELECT_OPTIONS}
          disabled={disabled}
        />
        <TextField
          label="Required approvals"
          required
          type="number"
          value={String(stage.requiredApprovals)}
          onChange={(value) => patchStage({ requiredApprovals: Number(value) || 1 })}
          disabled={disabled}
          error={fieldErrors[`${prefix}.requiredApprovals`]}
        />
        <SelectField
          id={`${prefix}-rejectionPolicy`}
          label="Rejection policy"
          value={stage.rejectionPolicy ?? 'ANY'}
          onValueChange={(value) =>
            value &&
            patchStage({
              rejectionPolicy: value as WorkflowStageInput['rejectionPolicy'],
              rejectionThreshold: value === 'THRESHOLD' ? stage.rejectionThreshold : null
            })
          }
          options={WORKFLOW_REJECTION_POLICY_SELECT_OPTIONS}
          disabled={disabled}
        />
        {stage.rejectionPolicy === 'THRESHOLD' ? (
          <TextField
            label="Rejection threshold"
            type="number"
            value={stage.rejectionThreshold == null ? '' : String(stage.rejectionThreshold)}
            onChange={(value) =>
              patchStage({ rejectionThreshold: value === '' ? null : Number(value) })
            }
            disabled={disabled}
            error={fieldErrors[`${prefix}.rejectionThreshold`]}
          />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${prefix}-escalation`}
            checked={stage.escalationEnabled ?? false}
            disabled={disabled}
            onCheckedChange={(checked) => patchStage({ escalationEnabled: checked === true })}
          />
          <Label htmlFor={`${prefix}-escalation`}>Escalation enabled</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${prefix}-distinct`}
            checked={stage.requireDistinctApprover ?? true}
            disabled={disabled}
            onCheckedChange={(checked) => patchStage({ requireDistinctApprover: checked === true })}
          />
          <Label htmlFor={`${prefix}-distinct`}>Require distinct approver</Label>
        </div>
      </div>

      {stage.escalationEnabled ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            id={`${prefix}-expiryUnit`}
            label="Expiry unit"
            value={stage.expiryPeriodUnit ?? ''}
            onValueChange={(value) =>
              value &&
              patchStage({ expiryPeriodUnit: value as WorkflowStageInput['expiryPeriodUnit'] })
            }
            options={WORKFLOW_EXPIRY_UNIT_SELECT_OPTIONS}
            placeholder="Select unit"
            disabled={disabled}
          />
          <TextField
            label="Expiry value"
            type="number"
            value={stage.expiryPeriodValue == null ? '' : String(stage.expiryPeriodValue)}
            onChange={(value) =>
              patchStage({ expiryPeriodValue: value === '' ? null : Number(value) })
            }
            disabled={disabled}
            error={fieldErrors[`${prefix}.expiryPeriodValue`]}
          />
          <SelectField
            id={`${prefix}-escalationTarget`}
            label="Escalation target stage"
            value={stage.escalationTargetStageCode ?? ''}
            onValueChange={(value) => patchStage({ escalationTargetStageCode: value ?? null })}
            options={escalationStageOptions}
            placeholder="Select stage"
            disabled={disabled}
            error={fieldErrors[`${prefix}.escalationTargetStageCode`]}
          />
        </div>
      ) : null}

      <div>
        <Label className="mb-2 block">Enabled actions</Label>
        <div className="flex flex-wrap gap-4">
          {WORKFLOW_ACTIONS.map((action) => (
            <div key={action} className="flex items-center gap-2">
              <Checkbox
                id={`${prefix}-action-${action}`}
                checked={stage.actions.includes(action)}
                disabled={disabled}
                onCheckedChange={(checked) => toggleAction(action, checked === true)}
              />
              <Label htmlFor={`${prefix}-action-${action}`}>{action}</Label>
            </div>
          ))}
        </div>
        {fieldErrors[`${prefix}.actions`] ? (
          <p className="mt-1 text-sm text-destructive">{fieldErrors[`${prefix}.actions`]}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Approval limit</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional ceiling for approvals at this stage. Actors are users with{' '}
            {checkerPermission ? (
              <span className="font-medium text-foreground">{checkerPermission}</span>
            ) : (
              <span className="font-medium text-foreground">{'{task}_CHECKER'}</span>
            )}
            , granted through roles in user administration.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Limit amount"
            optional
            type="number"
            value={stage.approvalLimitAmount == null ? '' : String(stage.approvalLimitAmount)}
            onChange={(value) =>
              patchStage({ approvalLimitAmount: value === '' ? null : Number(value) })
            }
            disabled={disabled}
            error={fieldErrors[`${prefix}.approvalLimitAmount`]}
          />
          <SelectField
            id={`${prefix}-approvalLimitCurrency`}
            label="Limit currency"
            optional
            value={stage.approvalLimitCurrency ?? ''}
            onValueChange={(value) => patchStage({ approvalLimitCurrency: value || null })}
            options={currencyOptions}
            placeholder="Optional"
            disabled={disabled}
            error={fieldErrors[`${prefix}.approvalLimitCurrency`]}
          />
        </div>
      </div>
    </div>
  );
}
