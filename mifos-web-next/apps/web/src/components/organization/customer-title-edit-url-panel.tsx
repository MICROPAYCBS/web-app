'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerTitle, CustomerTitleTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CustomerTitleFormSheet } from '@/components/organization/customer-title-form-sheet';

function customerTitleRevision(customerTitle: CustomerTitle): string {
  return [
    customerTitle.titleCode,
    customerTitle.titleName,
    customerTitle.genderId ?? '',
    customerTitle.displayOrder ?? '',
    customerTitle.status ?? ''
  ].join('|');
}

export function CustomerTitleEditUrlPanel({
  customerTitles,
  template
}: {
  customerTitles: CustomerTitle[];
  template: CustomerTitleTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const customerTitle =
    editId != null ? customerTitles.find((row) => String(row.id) === editId) : undefined;
  const open = customerTitle != null;

  useEffect(() => {
    if (editId != null && editId !== '' && customerTitle == null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [editId, customerTitle, pathname, router, searchParams]);

  function handleOpenChange(next: boolean) {
    if (!next && editId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!customerTitle) {
    return null;
  }

  return (
    <CustomerTitleFormSheet
      key={`${customerTitle.id}:${customerTitleRevision(customerTitle)}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      customerTitle={customerTitle}
      template={template}
    />
  );
}
