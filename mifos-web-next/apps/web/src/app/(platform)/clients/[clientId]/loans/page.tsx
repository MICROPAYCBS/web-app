/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountsTable } from '@/components/clients/detail/client-accounts-table';
import { DetailSection } from '@/components/composites';
import { toLoanAccountRows } from '@/lib/fineract/client-account-rows';
import {
  filterOpenLoanAccounts,
  getClientAccounts,
  mergeClientLoanAccounts
} from '@/lib/fineract/client-accounts';

export default async function ClientLoansPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const accounts = await getClientAccounts(clientId);
  const loans = filterOpenLoanAccounts(mergeClientLoanAccounts(accounts));
  const rows = toLoanAccountRows(loans);

  return (
    <DetailSection
      title="Loan accounts"
      description="Open and active loan accounts for this client. Account detail screens will link here in a later iteration."
    >
      <ClientAccountsTable rows={rows} emptyMessage="No active loan accounts for this client." />
    </DetailSection>
  );
}
