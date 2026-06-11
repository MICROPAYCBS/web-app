/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SmsCampaignEditForm } from '@/components/organization/sms-campaign-edit-form';
import { getSmsCampaign } from '@/lib/fineract/sms-campaigns';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSmsCampaignEditPage({
  params
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_SMSCAMPAIGN')) {
    notFound();
  }

  let campaign;
  try {
    campaign = await getSmsCampaign(campaignId);
  } catch {
    notFound();
  }

  if (campaign.campaignStatus?.value?.toLowerCase() === 'active') {
    notFound();
  }

  return <SmsCampaignEditForm campaign={campaign} />;
}
