/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SmsCampaignDetailView } from '@/components/organization/sms-campaign-detail-view';
import { getSmsCampaign } from '@/lib/fineract/sms-campaigns';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSmsCampaignDetailPage({
  params
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.smsCampaigns'))) {
    notFound();
  }

  let campaign;
  try {
    campaign = await getSmsCampaign(campaignId);
  } catch {
    notFound();
  }

  return (
    <SmsCampaignDetailView
      campaign={campaign}
      canEdit={can(session, 'UPDATE_SMSCAMPAIGN')}
      canActivate={can(session, 'ACTIVATE_SMSCAMPAIGN')}
      canClose={can(session, 'CLOSE_SMSCAMPAIGN')}
      canReactivate={can(session, 'REACTIVATE_SMSCAMPAIGN')}
      canDelete={can(session, 'DELETE_SMSCAMPAIGN')}
    />
  );
}
