'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BranchFormSheet,
  type BranchFormInitial
} from '@/components/organization/branch-form-sheet';

/** Opens the edit branch sidebar when the URL contains `?edit=1`. */
export function BranchEditUrlPanel({
  officeId,
  parentOptions,
  initial,
  showParentField
}: {
  officeId: number;
  parentOptions: FineractOfficeOption[];
  initial: BranchFormInitial;
  showParentField: boolean;
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
    <BranchFormSheet
      key={`${officeId}-${open ? 'open' : 'closed'}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      officeId={officeId}
      parentOptions={parentOptions}
      initial={initial}
      showParentField={showParentField}
    />
  );
}
