'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractRoleListItem, WorkflowApprovalAction } from '@mifos/api-client';
import {
  WORKFLOW_MODULE_SUGGESTIONS,
  formatActionErrorMessage,
  validateUpsertWorkflowDefinition,
  type UpsertWorkflowDefinitionInput,
  type WorkflowStageInput
} from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createApprovalWorkflowAction,
  updateApprovalWorkflowAction
} from '@/actions/approval-workflows';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { APPROVAL_WORKFLOWS_LIST_PATH, approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import { cn } from '@/lib/utils';

const WORKFLOW_ACTIONS: WorkflowApprovalAction[] = ['APPROVE', 'REJECT', 'RETURN', 'ESCALATE'];
const STAGE_TYPES = ['REVIEW', 'APPROVAL', 'VERIFICATION'] as const;
const REJECTION_POLICIES = ['ANY', 'ALL', 'THRESHOLD'] as const;
const EXPIRY_UNITS = ['HOURS', 'DAYS'] as const;

function emptyStage(index: number): WorkflowStageInput {
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
    actions: ['APPROVE', 'REJECT'],
    participants: [{ roleId: 0, approvalLimitAmount: null, approvalLimitCurrency: null }]
  };
}

function StageEditor({
  stage,
  stageIndex,
  stageCodes,
  roles,
  currencies,
  disabled,
  fieldErrors,
  onChange,
  onRemove,
  canRemove
}: {
  stage: WorkflowStageInput;
  stageIndex: number;
  stageCodes: string[];
  roles: FineractRoleListItem[];
  currencies: FineractCurrencyOption[];
  disabled: boolean;
  fieldErrors: Record<string, string>;
  onChange: (stage: WorkflowStageInput) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const prefix = `stages.${stageIndex}`;

  function patchStage(patch: Partial<WorkflowStageInput>) {
    onChange({ ...stage, ...patch });
  }

  function patchParticipant(
    participantIndex: number,
    patch: Partial<WorkflowStageInput['participants'][number]>
  ) {
    const participants = stage.participants.map((participant, index) =>
      index === participantIndex ? { ...participant, ...patch } : participant
    );
    patchStage({ participants });
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
        <h4 className="font-medium">Stage {stageIndex + 1}</h4>
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
        <div className="space-y-2">
          <Label>Stage type</Label>
          <Select
            value={stage.stageType}
            onValueChange={(value) =>
              patchStage({ stageType: value as WorkflowStageInput['stageType'] })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TextField
          label="Required approvals"
          required
          type="number"
          value={String(stage.requiredApprovals)}
          onChange={(value) => patchStage({ requiredApprovals: Number(value) || 1 })}
          disabled={disabled}
          error={fieldErrors[`${prefix}.requiredApprovals`]}
        />
        <div className="space-y-2">
          <Label>Rejection policy</Label>
          <Select
            value={stage.rejectionPolicy ?? 'ANY'}
            onValueChange={(value) =>
              patchStage({
                rejectionPolicy: value as WorkflowStageInput['rejectionPolicy'],
                rejectionThreshold: value === 'THRESHOLD' ? stage.rejectionThreshold : null
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_POLICIES.map((policy) => (
                <SelectItem key={policy} value={policy}>
                  {policy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            onCheckedChange={(checked) =>
              patchStage({ escalationEnabled: checked === true })
            }
          />
          <Label htmlFor={`${prefix}-escalation`}>Escalation enabled</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${prefix}-distinct`}
            checked={stage.requireDistinctApprover ?? true}
            disabled={disabled}
            onCheckedChange={(checked) =>
              patchStage({ requireDistinctApprover: checked === true })
            }
          />
          <Label htmlFor={`${prefix}-distinct`}>Require distinct approver</Label>
        </div>
      </div>

      {stage.escalationEnabled ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Expiry unit</Label>
            <Select
              value={stage.expiryPeriodUnit ?? ''}
              onValueChange={(value) =>
                patchStage({ expiryPeriodUnit: value as WorkflowStageInput['expiryPeriodUnit'] })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <div className="space-y-2">
            <Label>Escalation target stage</Label>
            <Select
              value={stage.escalationTargetStageCode ?? ''}
              onValueChange={(value) => patchStage({ escalationTargetStageCode: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stageCodes
                  .filter((code) => code !== stage.stageCode)
                  .map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
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
        <Label>Participants</Label>
        {stage.participants.map((participant, participantIndex) => (
          <div key={participantIndex} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={participant.roleId > 0 ? String(participant.roleId) : ''}
                onValueChange={(value) =>
                  patchParticipant(participantIndex, { roleId: Number(value) })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => !role.disabled)
                    .map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <TextField
              label="Approval limit"
              type="number"
              value={
                participant.approvalLimitAmount == null
                  ? ''
                  : String(participant.approvalLimitAmount)
              }
              onChange={(value) =>
                patchParticipant(participantIndex, {
                  approvalLimitAmount: value === '' ? null : Number(value)
                })
              }
              disabled={disabled}
            />
            <div className="space-y-2">
              <Label>Limit currency</Label>
              <Select
                value={participant.approvalLimitCurrency ?? ''}
                onValueChange={(value) =>
                  patchParticipant(participantIndex, { approvalLimitCurrency: value || null })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            patchStage({
              participants: [
                ...stage.participants,
                { roleId: 0, approvalLimitAmount: null, approvalLimitCurrency: null }
              ]
            })
          }
        >
          <Plus className="mr-1 size-4" />
          Add participant
        </Button>
        {fieldErrors[`${prefix}.participants`] ? (
          <p className="text-sm text-destructive">{fieldErrors[`${prefix}.participants`]}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ApprovalWorkflowForm({
  mode,
  definitionId,
  initialValues,
  roles,
  currencies
}: {
  mode: 'create' | 'edit';
  definitionId?: number;
  initialValues: UpsertWorkflowDefinitionInput;
  roles: FineractRoleListItem[];
  currencies: FineractCurrencyOption[];
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stageCodes = form.stages.map((stage) => stage.stageCode.trim()).filter(Boolean);

  function patchForm(patch: Partial<UpsertWorkflowDefinitionInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertWorkflowDefinitionInput;
      formRef.current = next;
      return next;
    });
  }

  function patchStage(stageIndex: number, stage: WorkflowStageInput) {
    const stages = form.stages.map((item, index) => (index === stageIndex ? stage : item));
    patchForm({ stages });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertWorkflowDefinition(formRef.current);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createApprovalWorkflowAction(parsed.data)
          : await updateApprovalWorkflowAction(definitionId as number, parsed.data);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Workflow created.' : 'Workflow updated.');
      if (mode === 'create' && result.resourceId != null) {
        router.push(approvalWorkflowDetailPath(result.resourceId));
      } else if (definitionId != null) {
        router.push(approvalWorkflowDetailPath(definitionId));
      } else {
        router.push(APPROVAL_WORKFLOWS_LIST_PATH);
      }
      router.refresh();
    });
  }

  return (
    <form
      id={formId}
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Basics</h3>
          <p className="text-sm text-muted-foreground">Module, name, and routing priority.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="moduleName">Module</Label>
            <Input
              id="moduleName"
              list="workflow-module-suggestions"
              value={form.moduleName}
              disabled={pending}
              onChange={(event) => patchForm({ moduleName: event.target.value })}
            />
            <datalist id="workflow-module-suggestions">
              {WORKFLOW_MODULE_SUGGESTIONS.map((moduleName) => (
                <option key={moduleName} value={moduleName} />
              ))}
            </datalist>
            {fieldErrors.moduleName ? (
              <p className="text-sm text-destructive">{fieldErrors.moduleName}</p>
            ) : null}
          </div>
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(value) => patchForm({ name: value })}
            disabled={pending}
            error={fieldErrors.name}
          />
          <TextField
            label="Priority"
            type="number"
            value={form.priority == null ? '' : String(form.priority)}
            onChange={(value) => patchForm({ priority: value === '' ? null : Number(value) })}
            disabled={pending}
          />
          <TextField
            label="Description"
            value={form.description ?? ''}
            onChange={(value) => patchForm({ description: value })}
            disabled={pending}
            className="md:col-span-2"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Selection criteria</h3>
          <p className="text-sm text-muted-foreground">
            Amount bands let several workflows coexist for the same module. Leave amounts empty for
            the default catch-all workflow.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currencyCode ?? ''}
              onValueChange={(value) => patchForm({ currencyCode: value || null })}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.currencyCode ? (
              <p className="text-sm text-destructive">{fieldErrors.currencyCode}</p>
            ) : null}
          </div>
          <TextField
            label="Minimum amount"
            type="number"
            value={form.minAmount == null ? '' : String(form.minAmount)}
            onChange={(value) => patchForm({ minAmount: value === '' ? null : Number(value) })}
            disabled={pending}
            error={fieldErrors.minAmount}
          />
          <TextField
            label="Maximum amount"
            type="number"
            value={form.maxAmount == null ? '' : String(form.maxAmount)}
            onChange={(value) => patchForm({ maxAmount: value === '' ? null : Number(value) })}
            disabled={pending}
            error={fieldErrors.maxAmount}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">Stages</h3>
            <p className="text-sm text-muted-foreground">
              Each stage defines participants, actions, and optional escalation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => patchForm({ stages: [...form.stages, emptyStage(form.stages.length)] })}
          >
            <Plus className="mr-1 size-4" />
            Add stage
          </Button>
        </div>
        <div className="space-y-4">
          {form.stages.map((stage, stageIndex) => (
            <StageEditor
              key={stageIndex}
              stage={stage}
              stageIndex={stageIndex}
              stageCodes={stageCodes}
              roles={roles}
              currencies={currencies}
              disabled={pending}
              fieldErrors={fieldErrors}
              onChange={(nextStage) => patchStage(stageIndex, nextStage)}
              onRemove={() =>
                patchForm({ stages: form.stages.filter((_, index) => index !== stageIndex) })
              }
              canRemove={form.stages.length > 1}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">Transitions</h3>
            <p className="text-sm text-muted-foreground">
              Connect stages in sequence. Optional amount bands apply to individual transitions.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              patchForm({
                transitions: [
                  ...form.transitions,
                  {
                    fromStageCode: stageCodes[0] ?? '',
                    toStageCode: stageCodes[1] ?? '',
                    sequenceNo: form.transitions.length + 1,
                    minAmount: null,
                    maxAmount: null
                  }
                ]
              })
            }
          >
            <Plus className="mr-1 size-4" />
            Add transition
          </Button>
        </div>
        <div className="space-y-3">
          {form.transitions.map((transition, transitionIndex) => (
            <div key={transitionIndex} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>From</Label>
                <Select
                  value={transition.fromStageCode}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    const transitions = form.transitions.map((item, index) =>
                      index === transitionIndex ? { ...item, fromStageCode: value } : item
                    );
                    patchForm({ transitions });
                  }}
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Select
                  value={transition.toStageCode}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    const transitions = form.transitions.map((item, index) =>
                      index === transitionIndex ? { ...item, toStageCode: value } : item
                    );
                    patchForm({ transitions });
                  }}
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TextField
                label="Sequence"
                type="number"
                value={String(transition.sequenceNo)}
                onChange={(value) => {
                  const transitions = form.transitions.map((item, index) =>
                    index === transitionIndex
                      ? { ...item, sequenceNo: Number(value) || 1 }
                      : item
                  );
                  patchForm({ transitions });
                }}
                disabled={pending}
              />
              <TextField
                label="Min amount"
                type="number"
                value={transition.minAmount == null ? '' : String(transition.minAmount)}
                onChange={(value) => {
                  const transitions = form.transitions.map((item, index) =>
                    index === transitionIndex
                      ? { ...item, minAmount: value === '' ? null : Number(value) }
                      : item
                  );
                  patchForm({ transitions });
                }}
                disabled={pending}
              />
              <div className="flex items-end gap-2">
                <TextField
                  label="Max amount"
                  type="number"
                  value={transition.maxAmount == null ? '' : String(transition.maxAmount)}
                  onChange={(value) => {
                    const transitions = form.transitions.map((item, index) =>
                      index === transitionIndex
                        ? { ...item, maxAmount: value === '' ? null : Number(value) }
                        : item
                    );
                    patchForm({ transitions });
                  }}
                  disabled={pending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() =>
                    patchForm({
                      transitions: form.transitions.filter((_, index) => index !== transitionIndex)
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-wrap">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? 'Create workflow' : 'Save changes'}
        </Button>
        <Link
          href={
            mode === 'edit' && definitionId != null
              ? approvalWorkflowDetailPath(definitionId)
              : APPROVAL_WORKFLOWS_LIST_PATH
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
