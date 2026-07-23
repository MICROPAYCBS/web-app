/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JobSequenceDetailView } from '@/components/system/job-sequences/job-sequence-detail-view';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { JOB_SEQUENCES_LIST_PATH } from '@/lib/fineract/job-sequence-paths';
import { getJobSequence, listJobSequenceRuns } from '@/lib/fineract/job-sequences';
import { listSchedulerJobs } from '@/lib/fineract/jobs';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function JobSequenceDetailPage({
  params
}: {
  params: Promise<{ sequenceId: string }>;
}) {
  const { sequenceId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.jobSequences'))) {
    notFound();
  }

  const [sequenceResult, runsResult, jobsResult] = await Promise.all([
    tryFineractLoad(() => getJobSequence(sequenceId), 'Could not load job sequence.'),
    tryFineractLoad(() => listJobSequenceRuns(sequenceId), 'Could not load sequence runs.'),
    tryFineractLoad(() => listSchedulerJobs(), 'Could not load scheduler jobs.')
  ]);

  if (!sequenceResult.ok) {
    return (
      <ListPage
        backLink={<DetailBackLink href={JOB_SEQUENCES_LIST_PATH} label="Back to job sequences" />}
        title="Job sequence"
      >
        <LoadErrorAlert title="Could not load job sequence" message={sequenceResult.message} />
      </ListPage>
    );
  }

  if (!sequenceResult.data) {
    notFound();
  }

  return (
    <JobSequenceDetailView
      sequence={sequenceResult.data}
      runs={runsResult.ok ? (runsResult.data ?? []) : []}
      jobs={jobsResult.ok ? (jobsResult.data ?? []) : []}
    />
  );
}
