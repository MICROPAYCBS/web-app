/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FundDetailView } from '@/components/organization/fund-detail-view';
import { getOrganizationFund } from '@/lib/fineract/funds';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationFundDetailPage({
  params
}: {
  params: Promise<{ fundId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.funds'))) {
    notFound();
  }

  const { fundId } = await params;
  const fund = await getOrganizationFund(fundId);

  return <FundDetailView fund={fund} />;
}
