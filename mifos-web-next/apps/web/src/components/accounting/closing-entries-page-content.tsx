'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlClosureListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ClosingEntriesTable } from '@/components/accounting/closing-entries-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ClosingEntriesPageContent({
  closures
}: {
  closures: FineractGlClosureListItem[];
}) {
  return (
    <ListPage
      title="Closing entries"
      description="Manage accounting closures by office and closing date."
      actions={
        <Can permission="CREATE_GLCLOSURE">
          <Link href="/accounting/closing-entries?create=1" className={cn(buttonVariants())}>
            Create closure
          </Link>
        </Can>
      }
    >
      <ClosingEntriesTable closures={closures} />
    </ListPage>
  );
}
