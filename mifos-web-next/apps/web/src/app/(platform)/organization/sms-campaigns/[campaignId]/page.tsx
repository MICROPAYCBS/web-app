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
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { getSmsCampaign } from '@/lib/fineract/sms-campaigns';
import { SMS_CAMPAIGN_LIST_PATH } from '@/lib/fineract/sms-campaign-paths';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
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

  const result = await tryFineractLoad(
    () => getSmsCampaign(campaignId),
    'Could not load SMS campaign.'
  );

  if (!result.ok) {
    return (
      <ListPage
        backLink={
          <DetailBackLink href={SMS_CAMPAIGN_LIST_PATH} label="Back to SMS campaigns" />
        }
        title="SMS campaign"
      >
        <LoadErrorAlert title="Could not load SMS campaign" message={result.message} />
      </ListPage>
    );
  }

  return (
    <SmsCampaignDetailView
      campaign={result.data}
      canEdit={can(session, 'UPDATE_SMSCAMPAIGN')}
      canActivate={can(session, 'ACTIVATE_SMSCAMPAIGN')}
      canClose={can(session, 'CLOSE_SMSCAMPAIGN')}
      canReactivate={can(session, 'REACTIVATE_SMSCAMPAIGN')}
      canDelete={can(session, 'DELETE_SMSCAMPAIGN')}
    />
  );
}
