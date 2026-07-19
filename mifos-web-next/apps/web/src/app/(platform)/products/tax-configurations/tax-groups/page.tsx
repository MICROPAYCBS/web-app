/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { TaxGroupsPageContent } from '@/components/products/tax/tax-groups-page-content';
import { listTaxGroups } from '@/lib/fineract/tax-groups';
import { getServerSession } from '@/lib/session/server';

export default async function TaxGroupsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('products.tax.groups'))) {
    notFound();
  }

  const groups = await listTaxGroups();
  return <TaxGroupsPageContent groups={groups} />;
}
