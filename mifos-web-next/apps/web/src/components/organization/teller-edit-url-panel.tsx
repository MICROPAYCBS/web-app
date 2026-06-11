'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption, OrganizationTeller } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TellerFormSheet } from '@/components/organization/teller-form-sheet';

/** Opens the edit teller sidebar when the URL contains `?edit=1`. */
export function TellerEditUrlPanel({
  teller,
  offices
}: {
  teller: OrganizationTeller;
  offices: FineractOfficeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get('edit') === '1';

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit') === '1') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <TellerFormSheet
      key={`${teller.id}-${open ? 'open' : 'closed'}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      teller={teller}
      offices={offices}
    />
  );
}
