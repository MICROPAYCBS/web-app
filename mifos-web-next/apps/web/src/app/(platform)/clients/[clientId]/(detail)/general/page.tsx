/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { notFound } from 'next/navigation';
import { ClientGeneralSections } from '@/components/clients/detail/client-general-sections';
import { ClientTransferStatusPanel } from '@/components/clients/detail/client-transfer-status-panel';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { buildClientFinancialSummary } from '@/lib/fineract/client-financial-summary';
import { getClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';
import { getClientIncomeSources } from '@/lib/fineract/client-income-source';
import { getClientAccounts } from '@/lib/fineract/client-accounts';
import { getClientTransferContext } from '@/lib/fineract/client-transfer';
import { getClient } from '@/lib/fineract/clients';
import { tryFineractLoad } from '@/lib/fineract/safe-load';

export default async function ClientGeneralPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const clientResult = await tryFineractLoad(
    () => getClient(clientId),
    'Could not load this customer.'
  );
  if (!clientResult.ok) {
    if (clientResult.status === 404) {
      notFound();
    }
    return (
      <LoadErrorAlert title="Customer unavailable" message={clientResult.message} />
    );
  }
  const client = clientResult.data;

  const [accountsResult, transferContext, incomeSources, complianceProfile] = await Promise.all([
    tryFineractLoad(
      () => getClientAccounts(clientId),
      'Could not load account summary for this customer.'
    ),
    getClientTransferContext(clientId).catch(() => null),
    getClientIncomeSources(clientId).catch(() => []),
    getClientComplianceProfile(clientId).catch(() => null)
  ]);

  const financialSummary = accountsResult.ok
    ? buildClientFinancialSummary(accountsResult.data)
    : null;

  return (
    <div className="space-y-6">
      {transferContext ? (
        <ClientTransferStatusPanel clientId={clientId} context={transferContext} />
      ) : null}
      <ClientGeneralSections
        client={client}
        financialSummary={financialSummary}
        accountsLoadError={accountsResult.ok ? undefined : accountsResult.message}
        incomeSources={incomeSources}
        complianceProfile={complianceProfile}
      />
    </div>
  );
}
