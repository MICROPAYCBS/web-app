'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { SectorCreateUrlPanel } from '@/components/organization/sector-create-url-panel';
import { SectorEditUrlPanel } from '@/components/organization/sector-edit-url-panel';
import { SectorsTable } from '@/components/organization/sectors-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { sectorCreatePath } from '@/lib/fineract/sector-paths';
import type { Sector, SectorTemplate } from '@/lib/fineract/sectors';
import { cn } from '@/lib/utils';

export function SectorsPageContent({
  sectors,
  template,
  canCreate,
  canEdit,
  canDelete
}: {
  sectors: Sector[];
  template: SectorTemplate;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Sectors"
        description="Manage economic sectors for customer and loan classification. Sectors can be organized in a parent hierarchy."
        actions={
          <Can permission="CREATE_SECTOR">
            <Link href={sectorCreatePath()} className={cn(buttonVariants())}>
              Create sector
            </Link>
          </Can>
        }
      >
        <SectorsTable sectors={sectors} canEdit={canEdit} canDelete={canDelete} />
      </ListPage>
      {canCreate ? (
        <Suspense fallback={null}>
          <SectorCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <SectorEditUrlPanel sectors={sectors} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}
