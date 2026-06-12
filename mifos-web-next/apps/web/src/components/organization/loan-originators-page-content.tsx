'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { LoanOriginatorsTable } from '@/components/organization/loan-originators-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { loanOriginatorCreatePath } from '@/lib/fineract/loan-originator-paths';
import { cn } from '@/lib/utils';

export function LoanOriginatorsPageContent({
  originators,
  canDelete
}: {
  originators: LoanOriginatorListItem[];
  canDelete: boolean;
}) {
  return (
    <ListPage
      title="Loan originators"
      description="Manage loan originators used when attaching originators to loan accounts."
      actions={
        <Can permission="CREATE_LOAN_ORIGINATOR">
          <Link href={loanOriginatorCreatePath()} className={cn(buttonVariants())}>
            Create loan originator
          </Link>
        </Can>
      }
    >
      <LoanOriginatorsTable originators={originators} canDelete={canDelete} />
    </ListPage>
  );
}
