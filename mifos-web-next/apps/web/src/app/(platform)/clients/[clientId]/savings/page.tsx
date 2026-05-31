/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountsTable } from '@/components/clients/detail/client-accounts-table';
import { DetailSection } from '@/components/composites';
import { toSavingsAccountRows } from '@/lib/fineract/client-account-rows';
import {
  filterOpenSavingsAccounts,
  filterSavingsByDepositType,
  getClientAccounts
} from '@/lib/fineract/client-accounts';

export default async function ClientSavingsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const accounts = await getClientAccounts(clientId);
  const savings = filterOpenSavingsAccounts(
    filterSavingsByDepositType(accounts.savingsAccounts ?? [], 'Savings')
  );
  const rows = toSavingsAccountRows(savings);

  return (
    <DetailSection title="Savings accounts" description="Standard savings accounts for this client.">
      <ClientAccountsTable rows={rows} emptyMessage="No active savings accounts"
        emptyDescription="This client has no open savings accounts." />
    </DetailSection>
  );
}
