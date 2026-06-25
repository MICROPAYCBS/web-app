/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { FineractHttpError } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import { ClientContactsView } from '@/components/clients/detail/client-contacts-view';
import { ClientGeneralSections } from '@/components/clients/detail/client-general-sections';
import { ClientTransferStatusPanel } from '@/components/clients/detail/client-transfer-status-panel';
import { buildClientFinancialSummary } from '@/lib/fineract/client-financial-summary';
import { getClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';
import { getClientContacts, getClientContactTemplate } from '@/lib/fineract/client-contacts';
import { getClientIncomeSources } from '@/lib/fineract/client-income-source';
import { getClientAccounts } from '@/lib/fineract/client-accounts';
import { getClientTransferContext } from '@/lib/fineract/client-transfer';
import { getClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export default async function ClientGeneralPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canCreateContact = can(session, 'CREATE_CLIENTCONTACT');
  const canUpdateContact = can(session, 'UPDATE_CLIENTCONTACT');
  const canDeleteContact = can(session, 'DELETE_CLIENTCONTACT');
  const showContacts = canCreateContact || canUpdateContact || canDeleteContact || can(session, 'READ_CLIENT');

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [accounts, transferContext, incomeSources, complianceProfile, contacts, contactTemplate] =
    await Promise.all([
      getClientAccounts(clientId),
      getClientTransferContext(clientId),
      getClientIncomeSources(clientId).catch(() => []),
      getClientComplianceProfile(clientId).catch(() => null),
      showContacts ? getClientContacts(clientId).catch(() => []) : Promise.resolve([]),
      showContacts
        ? getClientContactTemplate(clientId).catch(() => ({ contactTypeOptions: [] }))
        : Promise.resolve({ contactTypeOptions: [] })
    ]);
  const financialSummary = buildClientFinancialSummary(accounts);

  return (
    <div className="space-y-6">
      {transferContext ? (
        <ClientTransferStatusPanel clientId={clientId} context={transferContext} />
      ) : null}
      <ClientGeneralSections
        client={client}
        financialSummary={financialSummary}
        incomeSources={incomeSources}
        complianceProfile={complianceProfile}
      />
      {showContacts ? (
        <ClientContactsView
          clientId={clientId}
          contacts={contacts}
          contactTypeOptions={contactTemplate.contactTypeOptions}
          canCreate={canCreateContact}
          canUpdate={canUpdateContact}
          canDelete={canDeleteContact}
        />
      ) : null}
    </div>
  );
}
