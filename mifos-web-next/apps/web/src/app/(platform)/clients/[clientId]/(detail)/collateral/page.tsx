/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Suspense } from 'react';
import { ClientCollateralPageClient } from '@/components/clients/collateral/client-collateral-page-client';
import {
  getClientCollateralTemplate,
  listClientCollaterals
} from '@/lib/fineract/client-collaterals';

export default async function ClientCollateralPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const [items, template] = await Promise.all([
    listClientCollaterals(clientId),
    getClientCollateralTemplate(clientId)
  ]);

  return (
    <Suspense fallback={null}>
      <ClientCollateralPageClient
        clientId={clientId}
        initialItems={items}
        initialTemplate={template}
      />
    </Suspense>
  );
}
