/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { ClientNotesView } from '@/components/clients/detail/client-notes-view';
import { getClientNotes } from '@/lib/fineract/client-notes';
import { getServerSession } from '@/lib/session/server';

export default async function ClientNotesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canWrite = can(session, resolvePermission('clients.update'));
  const notes = await getClientNotes(clientId);

  return <ClientNotesView clientId={clientId} notes={notes} canWrite={canWrite} />;
}
