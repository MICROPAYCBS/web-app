/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountsSection } from '@/components/clients/detail/client-accounts-section';
import { clientAccountCreateAction } from '@/lib/clients/client-account-create-action';
import { toLoanAccountRows } from '@/lib/fineract/client-account-rows';
import {
  filterClosedLoanAccounts,
  filterOpenLoanAccounts,
  getClientAccounts,
  mergeClientLoanAccounts
} from '@/lib/fineract/client-accounts';
import { getClient } from '@/lib/fineract/clients';

export default async function ClientLoansPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  const accounts = await getClientAccounts(clientId);
  const allLoans = mergeClientLoanAccounts(accounts);
  const openRows = toLoanAccountRows(filterOpenLoanAccounts(allLoans), clientId);
  const closedRows = toLoanAccountRows(filterClosedLoanAccounts(allLoans), clientId);

  return (
    <ClientAccountsSection
      title="Loan accounts"
      description="Loan and working-capital accounts for this client."
      openRows={openRows}
      closedRows={closedRows}
      openEmptyMessage="No open loan accounts"
      openEmptyDescription="This client has no open loan or working-capital accounts."
      closedEmptyMessage="No closed loan accounts"
      closedEmptyDescription="This client has no closed loan accounts."
      createAction={clientAccountCreateAction(clientId, 'loan', client)}
      accountKind="loan"
    />
  );
}
