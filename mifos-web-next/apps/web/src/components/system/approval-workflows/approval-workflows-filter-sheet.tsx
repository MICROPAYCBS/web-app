'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkflowDefinitionStatus } from '@mifos/api-client';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { workflowDefinitionStatusLabel } from '@/lib/fineract/approval-workflow-display';
import type { ApprovalWorkflowListFilters } from '@/lib/fineract/approval-workflow-list-query';
import { WORKFLOW_MODULE_SUGGESTIONS } from '@mifos/validation';

const STATUS_OPTIONS: WorkflowDefinitionStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];

export function ApprovalWorkflowsFilterFields({
  draft,
  onDraftChange,
  disabled = false
}: {
  draft: ApprovalWorkflowListFilters;
  onDraftChange: (draft: ApprovalWorkflowListFilters) => void;
  disabled?: boolean;
}) {
  function patchDraft(patch: Partial<ApprovalWorkflowListFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <ListFilterSection
      title="Workflow criteria"
      description="Limit the list by module or lifecycle status."
    >
      <SelectField
        id="approval-workflows-module-filter"
        label="Module"
        optional
        value={draft.moduleName ?? ''}
        onValueChange={(value) =>
          patchDraft({ moduleName: value ? value : undefined })
        }
        options={WORKFLOW_MODULE_SUGGESTIONS.map((moduleName) => ({
          value: moduleName,
          label: moduleName
        }))}
        placeholder="All modules"
        disabled={disabled}
      />
      <SelectField
        id="approval-workflows-status-filter"
        label="Status"
        optional
        value={draft.status ?? ''}
        onValueChange={(value) =>
          patchDraft({
            status: value ? (value as WorkflowDefinitionStatus) : undefined
          })
        }
        options={STATUS_OPTIONS.map((status) => ({
          value: status,
          label: workflowDefinitionStatusLabel(status)
        }))}
        placeholder="All statuses"
        disabled={disabled}
      />
    </ListFilterSection>
  );
}

export function ApprovalWorkflowsFilterSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onApply,
  onClear,
  pending = false,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ApprovalWorkflowListFilters;
  onDraftChange: (draft: ApprovalWorkflowListFilters) => void;
  onApply: (filters: ApprovalWorkflowListFilters) => void;
  onClear: () => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  function handleApply() {
    onApply({
      moduleName: draft.moduleName || undefined,
      status: draft.status || undefined
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter approval workflows"
      description="Narrow the list by module or status."
      applyLabel={pending ? 'Applying…' : 'Apply filters'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
    >
      <ApprovalWorkflowsFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        disabled={disabled || pending}
      />
    </ListFilterSheet>
  );
}
