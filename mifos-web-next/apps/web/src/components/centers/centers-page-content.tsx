'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CentersPage } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { CentersTable } from '@/components/centers/centers-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { centerCreatePath } from '@/lib/fineract/center-paths';
import type { CentersListQuery } from '@/lib/fineract/centers-list-query';
import { cn } from '@/lib/utils';

export function CentersPageContent({
  initialPage,
  initialQuery
}: {
  initialPage: CentersPage;
  initialQuery: CentersListQuery;
}) {
  return (
    <ListPage
      title="Centers"
      description="Browse and manage centers for group lending."
      actions={
        <Can permission="CREATE_CENTER">
          <Link href={centerCreatePath()} className={cn(buttonVariants())}>
            New center
          </Link>
        </Can>
      }
    >
      <CentersTable initialPage={initialPage} initialQuery={initialQuery} />
    </ListPage>
  );
}
