/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DepositAccountDetailView } from '@/components/clients/accounts/deposit-account-detail-view';
import type { AccountOfficerPermissions } from '@/components/clients/accounts/actions/account-officer-actions';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import {
  CLIENT_ACCOUNT_RESERVED_IDS,
  clientGeneralPath
} from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { getDepositAccount } from '@/lib/fineract/deposit-account-officer-commands';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

function depositOfficerPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): AccountOfficerPermissions {
  return {
    assign: can(session, 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT'),
    reassign: can(session, {
      all: ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT']
    })
  };
}

export default async function FixedDepositAccountGeneralPage({
  params
}: {
  params: Promise<{ clientId: string; accountId: string }>;
}) {
  const { clientId, accountId } = await params;
  const session = await getServerSession();

  if (CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const result = await tryFineractLoad(
    () => getDepositAccount('fixedDeposit', accountId),
    'Could not load fixed deposit account.'
  );

  if (!result.ok) {
    return (
      <ListPage
        backLink={
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <DetailBackLink href={clientGeneralPath(clientId)} label="Back to customer" />
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <DetailBackLink
              href={clientAccountListPath(clientId, 'fixedDeposit')}
              label="Fixed deposits"
            />
          </div>
        }
        title="Fixed deposit account"
      >
        <LoadErrorAlert title="Could not load fixed deposit account" message={result.message} />
      </ListPage>
    );
  }

  if (!result.data) {
    notFound();
  }

  return (
    <DepositAccountDetailView
      account={result.data}
      clientId={clientId}
      kind="fixedDeposit"
      permissions={depositOfficerPermissions(session)}
    />
  );
}
