/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { ClientDocumentsView } from '@/components/clients/detail/client-documents-view';
import { getClientDocuments } from '@/lib/fineract/client-documents';
import { getServerSession } from '@/lib/session/server';

export default async function ClientDocumentsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canCreate = can(session, 'CREATE_DOCUMENT');
  const canDelete = can(session, 'DELETE_DOCUMENT');
  const documents = await getClientDocuments(clientId);

  return (
    <ClientDocumentsView
      clientId={clientId}
      documents={documents}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
