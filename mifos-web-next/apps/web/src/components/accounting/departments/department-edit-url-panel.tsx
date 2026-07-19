'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DepartmentFormSheet } from '@/components/accounting/departments/department-form-sheet';
import type { Department, DepartmentTemplate } from '@/lib/fineract/departments';

export function DepartmentEditUrlPanel({
  departments,
  template
}: {
  departments: Department[];
  template: DepartmentTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const department = editId ? departments.find((row) => String(row.id) === editId) : undefined;
  const open = department != null;

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!open || !department) {
    return null;
  }

  return (
    <DepartmentFormSheet
      key={department.id}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      template={template}
      department={department}
    />
  );
}
