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

export default async function ClientRecurringDepositsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [client, accounts, template] = await Promise.all([
    getClient(clientId),
    getClientAccounts(clientId),
    getClientDepositAccountTemplate('recurringDeposit', clientId)
  ]);
  const byType = filterSavingsByDepositType(accounts.savingsAccounts ?? [], 'Recurring Deposit');
  const openRows = toSavingsAccountRows(
    filterOpenSavingsAccounts(byType),
    clientId,
    'recurringDeposit'
  );
  const closedRows = toSavingsAccountRows(
    filterClosedSavingsAccounts(byType),
    clientId,
    'recurringDeposit'
  );

  return (
    <>
      <ClientAccountsSection
        title="Recurring deposit accounts"
        description="Recurring deposit accounts for this customer."
        openRows={openRows}
        closedRows={closedRows}
        openEmptyMessage="No open recurring deposit accounts"
        openEmptyDescription="This customer has no open recurring deposit accounts."
        closedEmptyMessage="No closed recurring deposit accounts"
        closedEmptyDescription="This customer has no closed recurring deposit accounts."
        createAction={clientAccountCreateAction(clientId, 'recurringDeposit', client)}
        accountKind="recurring-deposit"
      />
      <Suspense fallback={null}>
        <ClientDepositAccountCreateUrlPanel
          clientId={clientId}
          kind="recurringDeposit"
          initialTemplate={template}
        />
      </Suspense>
    </>
  );
}
