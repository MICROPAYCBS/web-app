/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { ClientAddressView } from '@/components/clients/detail/client-address-view';
import { getAddressFieldConfiguration } from '@/lib/fineract/clients';
import { getClientAddressTemplate, getClientAddresses } from '@/lib/fineract/client-address';
import { getServerSession } from '@/lib/session/server';

export default async function ClientAddressPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canUpdate = can(session, resolvePermission('clients.update'));

  const [addresses, fieldConfig, addressTemplate] = await Promise.all([
    getClientAddresses(clientId),
    getAddressFieldConfiguration().catch(() => []),
    getClientAddressTemplate().catch(() => ({
      addressTypeIdOptions: [],
      stateProvinceIdOptions: [],
      countryIdOptions: []
    }))
  ]);

  return (
    <ClientAddressView
      clientId={clientId}
      addresses={addresses}
      fieldConfig={fieldConfig}
      addressTemplate={addressTemplate}
      canUpdate={canUpdate}
    />
  );
}
