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
import { IndustryCreateUrlPanel } from '@/components/organization/industry-create-url-panel';
import { IndustryEditUrlPanel } from '@/components/organization/industry-edit-url-panel';
import { IndustriesTable } from '@/components/organization/industries-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { industryCreatePath } from '@/lib/fineract/industry-paths';
import type { Industry, IndustryTemplate } from '@/lib/fineract/industries';
import { cn } from '@/lib/utils';

export function IndustriesPageContent({
  industries,
  template,
  canCreate,
  canEdit,
  canDelete
}: {
  industries: Industry[];
  template: IndustryTemplate;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Industries"
        description="Manage industries within economic sectors for AML, credit risk, and lending classification."
        actions={
          <Can permission="CREATE_INDUSTRY">
            <Link href={industryCreatePath()} className={cn(buttonVariants())}>
              Create industry
            </Link>
          </Can>
        }
      >
        <IndustriesTable industries={industries} canEdit={canEdit} canDelete={canDelete} />
      </ListPage>
      {canCreate ? (
        <Suspense fallback={null}>
          <IndustryCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <IndustryEditUrlPanel industries={industries} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}
