'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass, CustomerClassTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { CustomerClassCreateUrlPanel } from '@/components/organization/customer-class-create-url-panel';
import { CustomerClassEditUrlPanel } from '@/components/organization/customer-class-edit-url-panel';
import { CustomerClassesTable } from '@/components/organization/customer-classes-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { customerClassCreatePath } from '@/lib/fineract/customer-class-paths';
import { cn } from '@/lib/utils';

export function CustomerClassesPageContent({
  customerClasses,
  template,
  canCreate,
  canEdit,
  canDelete
}: {
  customerClasses: CustomerClass[];
  template: CustomerClassTemplate;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <ListPage
        title="Customer classes"
        description="Configure customer segments, KYC requirements, and product eligibility rules."
        actions={
          <Can permission="CREATE_CUSTOMERCLASS">
            <Link href={customerClassCreatePath()} className={cn(buttonVariants())}>
              Create customer class
            </Link>
          </Can>
        }
      >
        <CustomerClassesTable
          customerClasses={customerClasses}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <CustomerClassCreateUrlPanel template={template} />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <CustomerClassEditUrlPanel customerClasses={customerClasses} template={template} />
        </Suspense>
      ) : null}
    </>
  );
}
