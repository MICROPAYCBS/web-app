/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SchedulerJobHistoryTable } from '@/components/system/manage-jobs/scheduler-job-history-table';
import { getSchedulerJob, getSchedulerJobHistory } from '@/lib/fineract/jobs';
import { getServerSession } from '@/lib/session/server';

export default async function SchedulerJobHistoryPage({
  params
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.jobs'))) {
    notFound();
  }

  const id = Number(jobId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const [job, historyPage] = await Promise.all([getSchedulerJob(id), getSchedulerJobHistory(id)]);
  if (!job) {
    notFound();
  }

  return <SchedulerJobHistoryTable job={job} history={historyPage.pageItems} />;
}
