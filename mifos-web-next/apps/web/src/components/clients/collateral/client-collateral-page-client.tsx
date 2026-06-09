'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientCollateralListItem, ClientCollateralTemplate } from '@mifos/api-client';
import { useCallback, useState, useTransition } from 'react';
import { fetchClientCollateralsAction } from '@/actions/client-collateral';
import { ClientCollateralView } from '@/components/clients/collateral/client-collateral-view';
import { ClientCollateralCreateUrlPanel } from '@/components/clients/collateral/client-collateral-create-url-panel';

export function ClientCollateralPageClient({
  clientId,
  initialItems,
  initialTemplate
}: {
  clientId: string;
  initialItems: ClientCollateralListItem[];
  initialTemplate: ClientCollateralTemplate;
}) {
  const [items, setItems] = useState(initialItems);
  const [, startRefresh] = useTransition();

  const handleCreated = useCallback(
    (created?: ClientCollateralListItem) => {
      if (created) {
        setItems((prev) => {
          const key = created.id ?? created.collateralId;
          if (key === undefined) {
            return [...prev, created];
          }
          const exists = prev.some((row) => (row.id ?? row.collateralId) === key);
          return exists ? prev : [...prev, created];
        });
      }
      startRefresh(async () => {
        const result = await fetchClientCollateralsAction(clientId);
        if (Array.isArray(result) && result.length > 0) {
          setItems(result);
        }
      });
    },
    [clientId]
  );

  return (
    <>
      <ClientCollateralView clientId={clientId} items={items} setItems={setItems} />
      <ClientCollateralCreateUrlPanel
        clientId={clientId}
        initialTemplate={initialTemplate}
        onCreated={handleCreated}
      />
    </>
  );
}
