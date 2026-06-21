/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { getServerSession } from '@/lib/session/server';
import { getClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';
import { ClientComplianceProfileView } from '@/components/clients/detail/client-compliance-profile-view';

export default async function ClientComplianceProfilePage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canUpdate = can(session, resolvePermission('clients.update'));
  const profile = await getClientComplianceProfile(clientId).catch(() => null);

  return (
    <ClientComplianceProfileView
      clientId={clientId}
      initialProfile={profile}
      canUpdate={canUpdate}
    />
  );
}
