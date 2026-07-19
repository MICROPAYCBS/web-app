'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LegalTenderFormSheet } from '@/components/organization/legal-tender-form-sheet';

export function LegalTenderEditUrlPanel({
  currencyCode,
  decimalPlaces,
  legalTenders
}: {
  currencyCode: string;
  decimalPlaces: number;
  legalTenders: CurrencyLegalTender[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const legalTender = legalTenders.find((row) => String(row.id) === editId);
  const open = editId != null && legalTender != null;

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <LegalTenderFormSheet
      key={open ? `edit-${editId}` : 'edit-closed'}
      currencyCode={currencyCode}
      decimalPlaces={decimalPlaces}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      legalTender={legalTender}
    />
  );
}
