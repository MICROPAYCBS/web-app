'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AdhocQueryListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { AdhocQueryTable } from '@/components/organization/adhoc-query-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { adhocQueryCreatePath } from '@/lib/fineract/adhoc-query-paths';
import { cn } from '@/lib/utils';

export function AdhocQueryPageContent({ queries }: { queries: AdhocQueryListItem[] }) {
  return (
    <ListPage
      title="Ad hoc query"
      description="Define custom SQL queries that insert results into tables and optionally email reports."
      actions={
        <Can permission="CREATE_ADHOC">
          <Link href={adhocQueryCreatePath()} className={cn(buttonVariants())}>
            Create ad hoc query
          </Link>
        </Can>
      }
    >
      <AdhocQueryTable queries={queries} />
    </ListPage>
  );
}
