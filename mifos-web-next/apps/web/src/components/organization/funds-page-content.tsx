'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationFund } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { FundCreateUrlPanel } from '@/components/organization/fund-create-url-panel';
import { FundEditUrlPanel } from '@/components/organization/fund-edit-url-panel';
import { FundsTable } from '@/components/organization/funds-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { fundCreatePath } from '@/lib/fineract/fund-paths';
import { cn } from '@/lib/utils';

export function FundsPageContent({
  funds,
  canCreate,
  canEdit
}: {
  funds: OrganizationFund[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  return (
    <>
      <ListPage
        title="Manage funds"
        description="Group loan products under named funds for portfolio reporting."
        actions={
          <Can permission="CREATE_FUND">
            <Link href={fundCreatePath()} className={cn(buttonVariants())}>
              Create fund
            </Link>
          </Can>
        }
      >
        <FundsTable funds={funds} canEdit={canEdit} />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <FundCreateUrlPanel />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <FundEditUrlPanel funds={funds} />
        </Suspense>
      ) : null}
    </>
  );
}
