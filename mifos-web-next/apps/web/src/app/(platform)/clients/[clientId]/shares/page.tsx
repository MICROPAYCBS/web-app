/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountsTable } from '@/components/clients/detail/client-accounts-table';
import { DetailSection } from '@/components/composites';
import { toShareAccountRows } from '@/lib/fineract/client-account-rows';
import { filterOpenShareAccounts, getClientAccounts } from '@/lib/fineract/client-accounts';

export default async function ClientSharesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const accounts = await getClientAccounts(clientId);
  const shares = filterOpenShareAccounts(accounts.shareAccounts ?? []);
  const rows = toShareAccountRows(shares);

  return (
    <DetailSection title="Share accounts" description="Share accounts for this client.">
      <ClientAccountsTable
        rows={rows}
        balanceHeader="Approved shares"
        extraHeader="Pending approval"
        emptyMessage="No active share accounts"
        emptyDescription="This client has no open share accounts."
      />
    </DetailSection>
  );
}
