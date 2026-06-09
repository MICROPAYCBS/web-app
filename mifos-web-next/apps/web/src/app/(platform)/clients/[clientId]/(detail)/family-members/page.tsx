/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { ClientFamilyView } from '@/components/clients/detail/client-family-view';
import { getClientFamilyMembers } from '@/lib/fineract/client-family';
import { getClient, getClientTemplate } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export default async function ClientFamilyMembersPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canUpdate = can(session, resolvePermission('clients.update'));

  const client = await getClient(clientId);
  const [members, template] = await Promise.all([
    getClientFamilyMembers(clientId),
    getClientTemplate(client.officeId).catch(() => getClientTemplate())
  ]);

  return (
    <ClientFamilyView
      clientId={clientId}
      members={members}
      familyOptions={template.familyMemberOptions}
      canUpdate={canUpdate}
    />
  );
}
