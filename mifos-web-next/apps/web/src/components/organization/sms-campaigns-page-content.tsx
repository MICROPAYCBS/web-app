'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { SmsCampaignsTable } from '@/components/organization/sms-campaigns-table';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { smsCampaignCreatePath } from '@/lib/fineract/sms-campaign-paths';
import { cn } from '@/lib/utils';

export function SmsCampaignsPageContent({
  campaigns,
  loadError,
  loadErrorStatus
}: {
  campaigns: SmsCampaignListItem[];
  loadError?: string;
  loadErrorStatus?: number;
}) {
  return (
    <ListPage
      title="SMS campaigns"
      description="Configure outbound SMS campaigns driven by business rules and reports."
      actions={
        <Can permission="CREATE_SMSCAMPAIGN">
          <Link href={smsCampaignCreatePath()} className={cn(buttonVariants())}>
            Create SMS campaign
          </Link>
        </Can>
      }
    >
      {loadError ? (
        <LoadErrorAlert
          title="SMS campaigns are unavailable"
          message={loadError}
          hint={
            loadErrorStatus === 403
              ? 'Configure an SMS provider under System → External services before using SMS campaigns.'
              : undefined
          }
        />
      ) : null}
      <SmsCampaignsTable campaigns={campaigns} />
    </ListPage>
  );
}
