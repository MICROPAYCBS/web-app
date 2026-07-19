/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { InvestorsPageContent } from '@/components/organization/investors-page-content';
import { searchInvestorTransfers } from '@/lib/fineract/investors';
import { getServerSession } from '@/lib/session/server';

export default async function InvestorsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.investors'))) {
    notFound();
  }

  const initialData = await searchInvestorTransfers({
    request: {},
    page: 0,
    size: 50
  });

  return <InvestorsPageContent initialData={initialData} />;
}
