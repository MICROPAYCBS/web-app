/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SmsCampaignWizard } from '@/components/organization/sms-campaign-wizard/sms-campaign-wizard';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { getSmsCampaignTemplate } from '@/lib/fineract/sms-campaigns';
import { SMS_CAMPAIGN_LIST_PATH } from '@/lib/fineract/sms-campaign-paths';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSmsCampaignCreatePage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_SMSCAMPAIGN')) {
    notFound();
  }

  const result = await tryFineractLoad(
    () => getSmsCampaignTemplate(),
    'Could not load SMS campaign template.'
  );

  if (!result.ok) {
    return (
      <ListPage
        backLink={
          <DetailBackLink href={SMS_CAMPAIGN_LIST_PATH} label="Back to SMS campaigns" />
        }
        title="Create SMS campaign"
        description="Define the campaign, compose the message, and review before submitting."
      >
        <LoadErrorAlert
          title="SMS campaigns are unavailable"
          message={result.message}
          hint={
            result.status === 403
              ? 'Configure an SMS provider under System → External services before creating campaigns.'
              : undefined
          }
        />
      </ListPage>
    );
  }

  return <SmsCampaignWizard template={result.data} />;
}
