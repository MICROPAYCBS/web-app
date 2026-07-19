'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFinancialActivityMappingFormTemplate, FineractFinancialActivityMappingListItem } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FinancialActivityMappingFormSheet } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-form-sheet';

/** Opens the create mapping sidebar when the URL contains `?create=1`. */
export function FinancialActivityMappingCreateUrlPanel({
  template,
  existingMappings
}: {
  template: FineractFinancialActivityMappingFormTemplate;
  existingMappings: FineractFinancialActivityMappingListItem[];
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
    <FinancialActivityMappingFormSheet
      key={open ? 'create-open' : 'create-closed'}
      open={open}
      onOpenChange={handleOpenChange}
      mode="create"
      template={template}
      existingMappings={existingMappings}
    />
  );
}
