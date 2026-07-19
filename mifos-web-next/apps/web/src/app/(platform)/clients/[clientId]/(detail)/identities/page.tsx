/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import type { FineractClientIdentifierTemplate } from '@mifos/api-client';
import { ClientIdentitiesView } from '@/components/clients/detail/client-identities-view';
import {
  getClientIdentifierTemplate,
  getClientIdentifiers
} from '@/lib/fineract/client-identifiers';
import { getServerSession } from '@/lib/session/server';

export default async function ClientIdentitiesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canCreate = can(session, 'CREATE_CLIENTIDENTIFIER');
  const canDelete = can(session, 'DELETE_CLIENTIDENTIFIER');

  const [identifiers, template] = await Promise.all([
    getClientIdentifiers(clientId),
    getClientIdentifierTemplate(clientId).catch(
      (): FineractClientIdentifierTemplate => ({ allowedDocumentTypes: [], identityTypeOptions: [] })
    )
  ]);

  return (
    <ClientIdentitiesView
      clientId={clientId}
      identifiers={identifiers}
      documentTypes={template.allowedDocumentTypes ?? []}
      identityTypeOptions={template.identityTypeOptions ?? []}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
