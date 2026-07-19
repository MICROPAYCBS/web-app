'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationFund } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { FundFormSheet } from '@/components/organization/fund-form-sheet';

export function FundEditUrlPanel({ funds }: { funds: OrganizationFund[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const fund = editId != null ? funds.find((row) => String(row.id) === editId) : undefined;
  const open = fund != null;

  useEffect(() => {
    if (editId != null && editId !== '' && fund == null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [editId, fund, pathname, router, searchParams]);

  function handleOpenChange(next: boolean) {
    if (!next && editId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!fund) {
    return null;
  }

  return (
    <FundFormSheet
      key={`${fund.id}-${open ? 'open' : 'closed'}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      fund={fund}
    />
  );
}
