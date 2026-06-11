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
import { getSmsCampaignTemplate } from '@/lib/fineract/sms-campaigns';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSmsCampaignCreatePage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_SMSCAMPAIGN')) {
    notFound();
  }

  const template = await getSmsCampaignTemplate();

  return <SmsCampaignWizard template={template} />;
}
