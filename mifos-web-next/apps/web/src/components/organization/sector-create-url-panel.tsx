'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SectorFormSheet } from '@/components/organization/sector-form-sheet';
import type { SectorTemplate } from '@/lib/fineract/sectors';

export function SectorCreateUrlPanel({ template }: { template: SectorTemplate }) {
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
    <SectorFormSheet
      key={open ? 'create-open' : 'create-closed'}
      open={open}
      onOpenChange={handleOpenChange}
      mode="create"
      template={template}
    />
  );
}
