'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientCollateralListItem, ClientCollateralTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreateClientCollateralSheet } from '@/components/clients/collateral/create-client-collateral-sheet';

/** Opens the create side panel when the URL contains `?create=1`. */
export function ClientCollateralCreateUrlPanel({
  clientId,
  initialTemplate,
  onCreated
}: {
  clientId: string;
  initialTemplate: ClientCollateralTemplate;
  onCreated?: (created?: ClientCollateralListItem) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get('create') === '1';

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('create') === '1') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('create');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <CreateClientCollateralSheet
      clientId={clientId}
      initialTemplate={initialTemplate}
      open={open}
      onOpenChange={handleOpenChange}
      onCreated={onCreated}
    />
  );
}
