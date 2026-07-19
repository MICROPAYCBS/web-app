/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SmsCampaignsPageContent } from '@/components/organization/sms-campaigns-page-content';
import { listSmsCampaigns } from '@/lib/fineract/sms-campaigns';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSmsCampaignsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.smsCampaigns'))) {
    notFound();
  }

  const result = await tryFineractLoad(
    () => listSmsCampaigns(),
    'Could not load SMS campaigns.'
  );

  return (
    <SmsCampaignsPageContent
      campaigns={result.ok ? result.data : []}
      loadError={result.ok ? undefined : result.message}
      loadErrorStatus={result.ok ? undefined : result.status}
    />
  );
}
