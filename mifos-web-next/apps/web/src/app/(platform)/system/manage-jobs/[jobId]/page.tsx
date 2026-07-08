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
import { SchedulerJobDetailView } from '@/components/system/manage-jobs/scheduler-job-detail-view';
import { getSchedulerJob } from '@/lib/fineract/jobs';
import { getServerSession } from '@/lib/session/server';

export default async function SchedulerJobDetailPage({
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

  const job = await getSchedulerJob(id);
  if (!job) {
    notFound();
  }

  return (
    <Suspense>
      <SchedulerJobDetailView job={job} canUpdate={can(session, 'UPDATE_SCHEDULER')} />
    </Suspense>
  );
}
