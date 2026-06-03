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

export default async function ClientRecurringDepositsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const accounts = await getClientAccounts(clientId);
  const recurring = filterOpenSavingsAccounts(
    filterSavingsByDepositType(accounts.savingsAccounts ?? [], 'Recurring Deposit')
  );
  const rows = toSavingsAccountRows(recurring);

  return (
    <DetailSection
      title="Recurring deposit accounts"
      description="Recurring deposit accounts for this client."
    >
      <ClientAccountsTable
        rows={rows}
        emptyMessage="No active recurring deposit accounts"
        emptyDescription="This client has no open recurring deposit accounts."
      />
    </DetailSection>
  );
}
