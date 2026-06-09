/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Suspense } from 'react';
import { ClientAccountsSection } from '@/components/clients/detail/client-accounts-section';
import { ClientDepositAccountCreateUrlPanel } from '@/components/clients/accounts/client-deposit-account-create-url-panel';
import { clientAccountCreateAction } from '@/lib/clients/client-account-create-action';
import { toSavingsAccountRows } from '@/lib/fineract/client-account-rows';
import {
  filterClosedSavingsAccounts,
  filterOpenSavingsAccounts,
  filterSavingsByDepositType,
  getClientAccounts
} from '@/lib/fineract/client-accounts';
import { getClientDepositAccountTemplate } from '@/lib/fineract/client-deposit-accounts';
import { getClient } from '@/lib/fineract/clients';

export default async function ClientFixedDepositsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [client, accounts, template] = await Promise.all([
    getClient(clientId),
    getClientAccounts(clientId),
    getClientDepositAccountTemplate('fixedDeposit', clientId)
  ]);
  const byType = filterSavingsByDepositType(accounts.savingsAccounts ?? [], 'Fixed Deposit');
  const openRows = toSavingsAccountRows(filterOpenSavingsAccounts(byType), clientId, 'fixedDeposit');
  const closedRows = toSavingsAccountRows(
    filterClosedSavingsAccounts(byType),
    clientId,
    'fixedDeposit'
  );

  return (
    <>
      <ClientAccountsSection
        title="Fixed deposit accounts"
        description="Fixed deposit accounts for this client."
        openRows={openRows}
        closedRows={closedRows}
        openEmptyMessage="No open fixed deposit accounts"
        openEmptyDescription="This client has no open fixed deposit accounts."
        closedEmptyMessage="No closed fixed deposit accounts"
        closedEmptyDescription="This client has no closed fixed deposit accounts."
        createAction={clientAccountCreateAction(clientId, 'fixedDeposit', client)}
        accountKind="fixed-deposit"
      />
      <Suspense fallback={null}>
        <ClientDepositAccountCreateUrlPanel
          clientId={clientId}
          kind="fixedDeposit"
          initialTemplate={template}
        />
      </Suspense>
    </>
  );
}
