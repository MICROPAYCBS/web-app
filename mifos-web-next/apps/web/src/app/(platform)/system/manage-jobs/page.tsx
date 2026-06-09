/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  ManageJobsPageContent,
  type ManageJobsTab
} from '@/components/system/manage-jobs/manage-jobs-page-content';
import { listSchedulerJobs, getSchedulerStatus, listWorkflowJobNames } from '@/lib/fineract/jobs';
import { getCobCatchUpStatus, listLockedLoans } from '@/lib/fineract/loans-cob';
import { getServerSession } from '@/lib/session/server';

function parseManageJobsTab(value: string | string[] | undefined): ManageJobsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'workflow' || raw === 'cob') {
    return raw;
  }
  return 'scheduler';
}

export default async function ManageJobsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.jobs'))) {
    notFound();
  }

  const params = await searchParams;
  const tab = parseManageJobsTab(params.tab);

  const [jobs, scheduler, workflowJobNames] = await Promise.all([
    listSchedulerJobs(),
    getSchedulerStatus(),
    listWorkflowJobNames()
  ]);

  let isCatchUpRunning = false;
  let lockedLoans: Awaited<ReturnType<typeof listLockedLoans>>['content'] = [];
  if (tab === 'cob') {
    const [catchUpStatus, lockedLoansPage] = await Promise.all([
      getCobCatchUpStatus(),
      listLockedLoans()
    ]);
    isCatchUpRunning = catchUpStatus.isCatchUpRunning;
    lockedLoans = lockedLoansPage.content;
  }

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading manage jobs…</p>}>
      <ManageJobsPageContent
        tab={tab}
        jobs={jobs}
        scheduler={scheduler}
        workflowJobNames={workflowJobNames}
        isCatchUpRunning={isCatchUpRunning}
        lockedLoans={lockedLoans}
        canUpdate={can(session, 'UPDATE_SCHEDULER')}
        canExecute={can(session, 'EXECUTEJOB_SCHEDULER')}
        canExecuteInline={can(session, 'EXECUTE_INLINE_JOB')}
      />
    </Suspense>
  );
}
