/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Suspense } from 'react';
import { ClientAccountsSection } from '@/components/clients/detail/client-accounts-section';
import { ShareAccountCreateUrlPanel } from '@/components/clients/shares/share-account-create-url-panel';
import { clientAccountCreateAction } from '@/lib/clients/client-account-create-action';
import { toShareAccountRows } from '@/lib/fineract/client-account-rows';
import {
  filterClosedShareAccounts,
  filterOpenShareAccounts,
  getClientAccounts
} from '@/lib/fineract/client-accounts';
import { getClient } from '@/lib/fineract/clients';
import { getShareAccountTemplate } from '@/lib/fineract/share-accounts';

export default async function ClientSharesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [client, accounts, template] = await Promise.all([
    getClient(clientId),
    getClientAccounts(clientId),
    getShareAccountTemplate(clientId)
  ]);
  const allShares = accounts.shareAccounts ?? [];
  const openRows = toShareAccountRows(filterOpenShareAccounts(allShares), clientId);
  const closedRows = toShareAccountRows(filterClosedShareAccounts(allShares), clientId);

  return (
    <>
      <ClientAccountsSection
        title="Share accounts"
        description="Share accounts for this customer."
        openRows={openRows}
        closedRows={closedRows}
        openEmptyMessage="No open share accounts"
        openEmptyDescription="This customer has no open share accounts."
        closedEmptyMessage="No closed share accounts"
        closedEmptyDescription="This customer has no closed share accounts."
        balanceHeader="Approved shares"
        extraHeader="Pending approval"
        createAction={clientAccountCreateAction(clientId, 'share', client)}
        accountKind="share"
      />
      <Suspense fallback={null}>
        <ShareAccountCreateUrlPanel clientId={clientId} initialTemplate={template} />
      </Suspense>
    </>
  );
}
