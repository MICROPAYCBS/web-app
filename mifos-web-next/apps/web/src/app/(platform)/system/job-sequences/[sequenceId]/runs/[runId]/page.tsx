/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JobSequenceRunDetailView } from '@/components/system/job-sequences/job-sequence-run-detail-view';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { jobSequenceDetailPath } from '@/lib/fineract/job-sequence-paths';
import { getJobSequenceRun } from '@/lib/fineract/job-sequences';
import { listSchedulerJobs } from '@/lib/fineract/jobs';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function JobSequenceRunPage({
  params
}: {
  params: Promise<{ sequenceId: string; runId: string }>;
}) {
  const { sequenceId, runId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.jobSequences'))) {
    notFound();
  }

  const sequenceIdNum = Number(sequenceId);
  const runIdNum = Number(runId);
  if (!Number.isFinite(sequenceIdNum) || !Number.isFinite(runIdNum)) {
    notFound();
  }

  const [runResult, jobsResult] = await Promise.all([
    tryFineractLoad(
      () => getJobSequenceRun(sequenceIdNum, runIdNum),
      'Could not load sequence run.'
    ),
    tryFineractLoad(() => listSchedulerJobs(), 'Could not load scheduler jobs.')
  ]);

  if (!runResult.ok) {
    return (
      <ListPage
        backLink={
          <DetailBackLink
            href={jobSequenceDetailPath(sequenceIdNum)}
            label="Back to sequence"
          />
        }
        title="Sequence run"
      >
        <LoadErrorAlert title="Could not load sequence run" message={runResult.message} />
      </ListPage>
    );
  }

  if (!runResult.data) {
    notFound();
  }

  return (
    <JobSequenceRunDetailView
      sequenceId={sequenceIdNum}
      initialRun={runResult.data}
      jobs={jobsResult.ok ? (jobsResult.data ?? []) : []}
    />
  );
}
