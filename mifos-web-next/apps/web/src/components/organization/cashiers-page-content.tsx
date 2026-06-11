'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem, OrganizationTeller } from '@mifos/api-client';
import { CashiersTable } from '@/components/organization/cashiers-table';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';
import { tellerDetailPath } from '@/lib/fineract/teller-paths';

export function CashiersPageContent({
  teller,
  cashiers
}: {
  teller: OrganizationTeller;
  cashiers: OrganizationCashierListItem[];
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href={tellerDetailPath(teller.id)} label="Back to teller" />}
          title={`Cashiers — ${teller.name}`}
          meta={`Branch: ${teller.officeName ?? '—'}`}
        />
      }
    >
      <CashiersTable cashiers={cashiers} />
    </DetailPage>
  );
}
