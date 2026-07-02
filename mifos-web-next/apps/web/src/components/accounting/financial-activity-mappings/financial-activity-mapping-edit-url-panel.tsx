'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractFinancialActivityMappingFormTemplate,
  FineractFinancialActivityMappingListItem
} from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { FinancialActivityMappingFormSheet } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-form-sheet';

/** Opens the edit mapping sidebar when the URL contains `?edit={mappingId}`. */
export function FinancialActivityMappingEditUrlPanel({
  mappings,
  template
}: {
  mappings: FineractFinancialActivityMappingListItem[];
  template: FineractFinancialActivityMappingFormTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const mapping =
    editId != null ? mappings.find((row) => String(row.id) === editId) : undefined;
  const open = mapping != null;

  useEffect(() => {
    if (editId != null && editId !== '' && mapping == null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [editId, mapping, pathname, router, searchParams]);

  function handleOpenChange(next: boolean) {
    if (!next && editId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!mapping) {
    return null;
  }

  return (
    <FinancialActivityMappingFormSheet
      key={`${mapping.id}-${open ? 'open' : 'closed'}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      template={template}
      mapping={mapping}
    />
  );
}
