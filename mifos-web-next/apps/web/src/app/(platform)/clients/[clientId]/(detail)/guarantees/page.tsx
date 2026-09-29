/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountsSection } from '@/components/clients/detail/client-accounts-section';
import { toGuarantorAccountRows } from '@/lib/fineract/client-account-rows';
import {
  getClientAccounts,
  isClosedLoanAccount,
  loadGuarantorLoanBorrowerIds,
  normalizeGuarantorAccounts
} from '@/lib/fineract/client-accounts';

export default async function ClientGuaranteesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const accounts = await getClientAccounts(clientId);
  const guarantees = normalizeGuarantorAccounts(accounts.guarantorAccounts);
  const borrowerIds = await loadGuarantorLoanBorrowerIds(guarantees.map((account) => account.id));
  const openRows = toGuarantorAccountRows(
    guarantees.filter((account) => !isClosedLoanAccount(account.status?.code)),
    borrowerIds
  );
  const closedRows = toGuarantorAccountRows(
    guarantees.filter((account) => isClosedLoanAccount(account.status?.code)),
    borrowerIds
  );

  return (
    <ClientAccountsSection
      title="Guarantee accounts"
      description="Loans this customer guarantees. Open an account to see the borrower's loan."
      openRows={openRows}
      closedRows={closedRows}
      openEmptyMessage="No guarantee accounts"
      openEmptyDescription="This customer is not an active guarantor on an open loan."
      closedEmptyMessage="No closed guarantee accounts"
      closedEmptyDescription="This customer has no guarantees on closed loans."
      accountKind="guarantee"
      balanceHeader="Outstanding"
      extraHeader="Details"
    />
  );
}
