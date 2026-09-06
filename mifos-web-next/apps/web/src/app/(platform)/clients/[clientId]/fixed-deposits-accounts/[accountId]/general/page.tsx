/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { notFound } from 'next/navigation';
import { DepositAccountDetailView } from '@/components/clients/accounts/deposit-account-detail-view';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import {
  CLIENT_ACCOUNT_RESERVED_IDS,
  clientGeneralPath
} from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { getDepositAccount } from '@/lib/fineract/deposit-account-officer-commands';
import {
  termDepositLifecyclePermissions,
  termDepositOfficerPermissions
} from '@/lib/fineract/deposit-account-permissions';
import { depositTransactionActionPermissions } from '@/lib/fineract/deposit-transaction-action-permissions';
import { loadClientAccountBackLabel } from '@/lib/fineract/load-client-account-back-label';
import { loadReportOrganisationName } from '@/lib/fineract/load-report-organisation-name';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

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

  const [result, reportOrgName] = await Promise.all([
    tryFineractLoad(
      () => getDepositAccount('fixedDeposit', accountId),
      'Could not load fixed deposit account.'
    ),
    loadReportOrganisationName()
  ]);

  if (!result.ok) {
    const customerBackLabel = await loadClientAccountBackLabel(clientId);
    return (
      <ListPage
        backLink={
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <DetailBackLink href={clientGeneralPath(clientId)} label={customerBackLabel} />
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
      permissions={termDepositOfficerPermissions(session)}
      lifecyclePermissions={termDepositLifecyclePermissions(session, 'fixedDeposit')}
      reportOrgName={reportOrgName}
      transactionActionPermissions={depositTransactionActionPermissions(session)}
    />
  );
}
