/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { ClientIncomeSourceView } from '@/components/clients/detail/client-income-source-view';
import {
  getClientIncomeSourceTemplate,
  getClientIncomeSources
} from '@/lib/fineract/client-income-source';
import { getServerSession } from '@/lib/session/server';

export default async function ClientIncomeSourcesPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canUpdate = can(session, resolvePermission('clients.update'));

  const [incomeSources, incomeSourceOptions] = await Promise.all([
    getClientIncomeSources(clientId),
    getClientIncomeSourceTemplate(clientId).catch(() => ({}))
  ]);

  return (
    <ClientIncomeSourceView
      clientId={clientId}
      incomeSources={incomeSources}
      incomeSourceOptions={incomeSourceOptions}
      canUpdate={canUpdate}
    />
  );
}
