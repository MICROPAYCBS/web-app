'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportListItem } from '@mifos/api-client';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { ReportsTable } from '@/components/system/reports-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ReportsPageContent({
  reports,
  canCreate
}: {
  reports: FineractReportListItem[];
  canCreate: boolean;
}) {
  return (
    <ListPage
      title="Report configuration"
      description="Define report SQL, parameters, and which reports appear in the user reports menu."
      actions={
        canCreate ? (
          <Link href="/system/reports/create" className={cn(buttonVariants())}>
            <Plus className="mr-2 size-4" />
            Create report
          </Link>
        ) : null
      }
    >
      <ReportsTable reports={reports} />
    </ListPage>
  );
}
