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
import type { Sector, SectorTemplate } from '@/lib/fineract/sectors';

export function SectorEditUrlPanel({
  sectors,
  template
}: {
  sectors: Sector[];
  template: SectorTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const sector = editId ? sectors.find((row) => String(row.id) === editId) : undefined;
  const open = sector != null;

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!open || !sector) {
    return null;
  }

  return (
    <SectorFormSheet
      key={sector.id}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      template={template}
      sector={sector}
    />
  );
}
