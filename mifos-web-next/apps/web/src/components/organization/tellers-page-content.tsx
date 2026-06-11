'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption, OrganizationTellerListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { TellerCreateUrlPanel } from '@/components/organization/teller-create-url-panel';
import { TellersTable } from '@/components/organization/tellers-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { tellerCreatePath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

export function TellersPageContent({
  tellers,
  offices,
  canCreate
}: {
  tellers: OrganizationTellerListItem[];
  offices: FineractOfficeOption[];
  canCreate: boolean;
}) {
  return (
    <>
      <ListPage
        title="Tellers"
        description="Manage teller windows and cashier assignments at each branch."
        actions={
          <Can permission="CREATE_TELLER">
            <Link href={tellerCreatePath()} className={cn(buttonVariants())}>
              Create teller
            </Link>
          </Can>
        }
      >
        <TellersTable tellers={tellers} />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <TellerCreateUrlPanel offices={offices} />
        </Suspense>
      ) : null}
    </>
  );
}
