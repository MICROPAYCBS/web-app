'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreateShareAccountSheet } from '@/components/clients/shares/create-share-account-sheet';

/** Opens the create side panel when the URL contains `?create=1`. */
export function ShareAccountCreateUrlPanel({
  clientId,
  initialTemplate,
  onCreated
}: {
  clientId: string;
  initialTemplate: FineractShareAccountTemplate;
  onCreated?: () => void;
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
    <CreateShareAccountSheet
      clientId={clientId}
      initialTemplate={initialTemplate}
      open={open}
      onOpenChange={handleOpenChange}
      onCreated={onCreated}
    />
  );
}
