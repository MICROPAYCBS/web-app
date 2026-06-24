'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerTitle, CustomerTitleTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { CustomerTitleCreateUrlPanel } from '@/components/organization/customer-title-create-url-panel';
import { CustomerTitleEditUrlPanel } from '@/components/organization/customer-title-edit-url-panel';
import { CustomerTitlesTable } from '@/components/organization/customer-titles-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { customerTitleCreatePath } from '@/lib/fineract/customer-title-paths';
import { cn } from '@/lib/utils';

export function CustomerTitlesPageContent({
  customerTitles,
  template,
  canCreate,
  canEdit,
  canDelete
}: {
  customerTitles: CustomerTitle[];
  template: CustomerTitleTemplate;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Customer titles"
        description="Manage salutation titles for customer biodata. Add gender-specific or neutral titles; inactive titles are hidden on new client forms."
        actions={
          <Can permission="CREATE_CLIENTTITLE">
            <Link href={customerTitleCreatePath()} className={cn(buttonVariants())}>
              Create customer title
            </Link>
          </Can>
        }
      >
        <CustomerTitlesTable
          customerTitles={customerTitles}
          template={template}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <CustomerTitleCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <CustomerTitleEditUrlPanel customerTitles={customerTitles} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}
