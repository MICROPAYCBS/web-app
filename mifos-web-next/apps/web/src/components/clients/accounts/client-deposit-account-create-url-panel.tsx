'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, ClientDepositAccountTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreateClientDepositAccountSheet } from '@/components/clients/accounts/create-client-deposit-account-sheet';

/** Opens the create side panel when the URL contains `?create=1`. */
export function ClientDepositAccountCreateUrlPanel({
  clientId,
  kind,
  initialTemplate,
  onCreated
}: {
  clientId: string;
  kind: ClientDepositAccountKind;
  initialTemplate: ClientDepositAccountTemplate;
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
    <CreateClientDepositAccountSheet
      clientId={clientId}
      kind={kind}
      initialTemplate={initialTemplate}
      open={open}
      onOpenChange={handleOpenChange}
      onCreated={onCreated}
    />
  );
}
