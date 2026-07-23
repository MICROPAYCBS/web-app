/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JobSequenceFormPageContent } from '@/components/system/job-sequences/job-sequence-form-page-content';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { JOB_SEQUENCES_LIST_PATH } from '@/lib/fineract/job-sequence-paths';
import { listSchedulerJobs } from '@/lib/fineract/jobs';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function CreateJobSequencePage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('system.jobSequences')) ||
    !can(session, resolvePermission('system.jobSequences.create'))
  ) {
    notFound();
  }

  const jobsResult = await tryFineractLoad(
    () => listSchedulerJobs(),
    'Could not load scheduler jobs.'
  );

  if (!jobsResult.ok) {
    return (
      <ListPage
        backLink={<DetailBackLink href={JOB_SEQUENCES_LIST_PATH} label="Back to job sequences" />}
        title="Create job sequence"
      >
        <LoadErrorAlert title="Could not load scheduler jobs" message={jobsResult.message} />
      </ListPage>
    );
  }

  return <JobSequenceFormPageContent mode="create" jobs={jobsResult.data ?? []} />;
}
