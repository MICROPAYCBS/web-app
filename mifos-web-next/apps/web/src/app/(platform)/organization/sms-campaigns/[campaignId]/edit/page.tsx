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
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { getSmsCampaign } from '@/lib/fineract/sms-campaigns';
import { smsCampaignDetailPath } from '@/lib/fineract/sms-campaign-paths';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
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

  const result = await tryFineractLoad(
    () => getSmsCampaign(campaignId),
    'Could not load SMS campaign.'
  );

  if (!result.ok) {
    return (
      <ListPage
        backLink={
          <DetailBackLink
            href={smsCampaignDetailPath(campaignId)}
            label="Back to SMS campaign"
          />
        }
        title="Edit SMS campaign"
        description="Update campaign settings and message content."
      >
        <LoadErrorAlert title="Could not load SMS campaign" message={result.message} />
      </ListPage>
    );
  }

  const campaign = result.data;

  if (campaign.campaignStatus?.value?.toLowerCase() === 'active') {
    notFound();
  }

  return <SmsCampaignEditForm campaign={campaign} />;
}
