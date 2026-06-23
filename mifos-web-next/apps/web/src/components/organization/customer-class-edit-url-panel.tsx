'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass, CustomerClassTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CustomerClassFormSheet } from '@/components/organization/customer-class-form-sheet';

export function CustomerClassEditUrlPanel({
  customerClasses,
  template
}: {
  customerClasses: CustomerClass[];
  template: CustomerClassTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const customerClass =
    editId != null ? customerClasses.find((row) => String(row.id) === editId) : undefined;
  const open = customerClass != null;

  useEffect(() => {
    if (editId != null && editId !== '' && customerClass == null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [editId, customerClass, pathname, router, searchParams]);

  function handleOpenChange(next: boolean) {
    if (!next && editId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!customerClass) {
    return null;
  }

  return (
    <CustomerClassFormSheet
      key={`${customerClass.id}-${open ? 'open' : 'closed'}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      customerClass={customerClass}
      template={template}
    />
  );
}
