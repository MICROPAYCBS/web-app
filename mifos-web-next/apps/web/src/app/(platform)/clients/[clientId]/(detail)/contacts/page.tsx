/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { ClientContactsView } from '@/components/clients/detail/client-contacts-view';
import { getClientContacts, getClientContactTemplate } from '@/lib/fineract/client-contacts';
import { getServerSession } from '@/lib/session/server';

export default async function ClientContactsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canCreate = can(session, 'CREATE_CLIENTCONTACT');
  const canUpdate = can(session, 'UPDATE_CLIENTCONTACT');
  const canDelete = can(session, 'DELETE_CLIENTCONTACT');
  const canRead = canCreate || canUpdate || canDelete || can(session, 'READ_CLIENT');

  if (!canRead) {
    return null;
  }

  const [contacts, contactTemplate] = await Promise.all([
    getClientContacts(clientId).catch(() => []),
    getClientContactTemplate(clientId).catch(() => ({ contactTypeOptions: [] }))
  ]);

  return (
    <ClientContactsView
      clientId={clientId}
      contacts={contacts}
      contactTypeOptions={contactTemplate.contactTypeOptions}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}
