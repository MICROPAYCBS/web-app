'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJobSequence } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { EmptyState } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { JobSequencesTable } from '@/components/system/job-sequences/job-sequences-table';
import { buttonVariants } from '@/components/ui/button';
import { jobSequenceCreatePath } from '@/lib/fineract/job-sequence-paths';
import { cn } from '@/lib/utils';

export function JobSequencesPageContent({ sequences }: { sequences: FineractJobSequence[] }) {
  return (
    <ListPage
      title="Job sequences"
      description="Named, ordered packs of scheduler jobs and platform operations — for example the seeded END_OF_DAY close."
      actions={
        <Can permission="CREATE_JOBSEQUENCE">
          <Link href={jobSequenceCreatePath()} className={cn(buttonVariants())}>
            Create sequence
          </Link>
        </Can>
      }
    >
      {sequences.length === 0 ? (
        <EmptyState
          title="No job sequences yet"
          description="After migration, the tenant seeds END_OF_DAY (advance business date, Loan COB, WC Loan COB, savings interest, GL snapshots). Create a sequence to chain other jobs."
        />
      ) : (
        <JobSequencesTable sequences={sequences} />
      )}
    </ListPage>
  );
}
