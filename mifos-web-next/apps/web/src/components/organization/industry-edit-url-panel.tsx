'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IndustryFormSheet } from '@/components/organization/industry-form-sheet';
import type { Industry, IndustryTemplate } from '@/lib/fineract/industries';

export function IndustryEditUrlPanel({
  industries,
  template
}: {
  industries: Industry[];
  template: IndustryTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const industry = editId ? industries.find((row) => String(row.id) === editId) : undefined;
  const open = industry != null;

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!open || !industry) {
    return null;
  }

  return (
    <IndustryFormSheet
      key={industry.id}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      template={template}
      industry={industry}
    />
  );
}
