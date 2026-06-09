'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractLockedLoan,
  FineractSchedulerJob,
  FineractSchedulerStatus
} from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { ListPage } from '@/components/composites/list-page';
import { CobJobsPanel } from '@/components/system/manage-jobs/cob-jobs-panel';
import { SchedulerJobsPanel } from '@/components/system/manage-jobs/scheduler-jobs-panel';
import { WorkflowJobsPanel } from '@/components/system/manage-jobs/workflow-jobs-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ManageJobsTab = 'scheduler' | 'workflow' | 'cob';

function buildManageJobsUrl(tab: ManageJobsTab): string {
  return tab === 'scheduler' ? '/system/manage-jobs' : `/system/manage-jobs?tab=${tab}`;
}

export function ManageJobsPageContent({
  tab,
  jobs,
  scheduler,
  workflowJobNames,
  isCatchUpRunning,
  lockedLoans,
  canUpdate,
  canExecute,
  canExecuteInline
}: {
  tab: ManageJobsTab;
  jobs: FineractSchedulerJob[];
  scheduler: FineractSchedulerStatus;
  workflowJobNames: string[];
  isCatchUpRunning: boolean;
  lockedLoans: FineractLockedLoan[];
  canUpdate: boolean;
  canExecute: boolean;
  canExecuteInline: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigateTab = useCallback(
    (nextTab: ManageJobsTab) => {
      startTransition(() => {
        router.push(buildManageJobsUrl(nextTab));
      });
    },
    [router]
  );

  return (
    <ListPage
      title="Manage jobs"
      description="Scheduler jobs, workflow steps, and close-of-business processing."
    >
      <Tabs value={tab} onValueChange={(value) => navigateTab(value as ManageJobsTab)}>
        <TabsList>
          <TabsTrigger value="scheduler" disabled={pending}>
            Scheduler jobs
          </TabsTrigger>
          <TabsTrigger value="workflow" disabled={pending}>
            Workflow jobs
          </TabsTrigger>
          <TabsTrigger value="cob" disabled={pending}>
            COB
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scheduler" className="mt-6">
          <SchedulerJobsPanel
            jobs={jobs}
            scheduler={scheduler}
            canUpdate={canUpdate}
            canExecute={canExecute}
          />
        </TabsContent>
        <TabsContent value="workflow" className="mt-6">
          {workflowJobNames.length ? (
            <WorkflowJobsPanel jobNames={workflowJobNames} canUpdate={canUpdate} />
          ) : (
            <p className="text-sm text-muted-foreground">No workflow jobs are configured.</p>
          )}
        </TabsContent>
        <TabsContent value="cob" className="mt-6">
          <CobJobsPanel
            isCatchUpRunning={isCatchUpRunning}
            loans={lockedLoans}
            canUpdate={canUpdate}
            canExecuteInline={canExecuteInline}
          />
        </TabsContent>
      </Tabs>
    </ListPage>
  );
}
