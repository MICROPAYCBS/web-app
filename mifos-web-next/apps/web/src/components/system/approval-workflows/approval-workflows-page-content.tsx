'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration, FineractRolePermissionUsage, WorkflowDefinition } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { ListPage } from '@/components/composites/list-page';
import { ApprovalWorkflowsDisabledAlert } from '@/components/system/approval-workflows/approval-workflows-disabled-alert';
import { ApprovalWorkflowsFilterSheet } from '@/components/system/approval-workflows/approval-workflows-filter-sheet';
import { ApprovalWorkflowsTable } from '@/components/system/approval-workflows/approval-workflows-table';
import { buttonVariants } from '@/components/ui/button';
import { approvalWorkflowCreatePath } from '@/lib/fineract/approval-workflow-paths';
import {
  countActiveApprovalWorkflowListFilters,
  type ApprovalWorkflowListFilters
} from '@/lib/fineract/approval-workflow-list-query';
import { cn } from '@/lib/utils';

function filtersSignature(filters: ApprovalWorkflowListFilters): string {
  return `${filters.taskPermissionCode ?? ''}|${filters.status ?? ''}`;
}

export function ApprovalWorkflowsPageContent({
  definitions,
  taskPermissions,
  engineConfiguration,
  makerCheckerGloballyEnabled,
  canUpdateConfiguration
}: {
  definitions: WorkflowDefinition[];
  taskPermissions: FineractRolePermissionUsage[];
  engineConfiguration: FineractGlobalConfiguration | null;
  makerCheckerGloballyEnabled: boolean | null;
  canUpdateConfiguration: boolean;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ApprovalWorkflowListFilters>({});
  const [draftFilters, setDraftFilters] = useState<ApprovalWorkflowListFilters>({});

  const appliedFiltersSignature = useMemo(
    () => filtersSignature(appliedFilters),
    [appliedFilters]
  );
  const activeFilterCount = countActiveApprovalWorkflowListFilters(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFiltersSignature, appliedFilters]);

  function handleApplyFilters(nextFilters: ApprovalWorkflowListFilters) {
    setAppliedFilters(nextFilters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
  }

  return (
    <>
      <ListPage
        title="Approval workflows"
        description="Define multi-stage approval chains for maker-checker tasks. Higher priority wins when multiple active workflows share a task."
        actions={
          <Can permission="CREATE_WORKFLOW_DEFINITION">
            <Link href={approvalWorkflowCreatePath()} className={cn(buttonVariants())}>
              Create workflow
            </Link>
          </Can>
        }
      >
        <div className="space-y-6">
          <ApprovalWorkflowsDisabledAlert
            configuration={engineConfiguration}
            canUpdateConfiguration={canUpdateConfiguration}
          />
          <ApprovalWorkflowsTable
            definitions={definitions}
            appliedFilters={appliedFilters}
            taskPermissions={taskPermissions}
            makerCheckerGloballyEnabled={makerCheckerGloballyEnabled}
            filterTrigger={
              <ListFilterTrigger
                activeCount={activeFilterCount}
                onClick={() => setFilterOpen(true)}
              />
            }
          />
        </div>
      </ListPage>

      <ApprovalWorkflowsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        taskPermissions={taskPermissions}
      />
    </>
  );
}
