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
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { FUND_LIST_PATH, fundEditPath } from '@/lib/fineract/fund-paths';
import { cn } from '@/lib/utils';

export function FundDetailView({ fund }: { fund: OrganizationFund }) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href={FUND_LIST_PATH} label="Back to funds" />}
          title={fund.name}
          actions={
            <Can permission="UPDATE_FUND">
              <Link href={fundEditPath(fund.id)} className={cn(buttonVariants())}>
                Edit
              </Link>
            </Can>
          }
        />
      }
    >
      <DetailSection title="Overview">
        <DetailFieldGrid columns={1}>
          <DetailField label="Name">{fund.name}</DetailField>
          <DetailField label="External ID">{fund.externalId?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </DetailPage>
  );
}
