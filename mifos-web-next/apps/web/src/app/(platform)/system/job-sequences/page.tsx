/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JobSequencesPageContent } from '@/components/system/job-sequences/job-sequences-page-content';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { listJobSequences } from '@/lib/fineract/job-sequences';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function JobSequencesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.jobSequences'))) {
    notFound();
  }

  const result = await tryFineractLoad(
    () => listJobSequences(),
    'Could not load job sequences.'
  );

  if (!result.ok) {
    return (
      <ListPage title="Job sequences">
        <LoadErrorAlert title="Could not load job sequences" message={result.message} />
      </ListPage>
    );
  }

  return <JobSequencesPageContent sequences={result.data ?? []} />;
}
