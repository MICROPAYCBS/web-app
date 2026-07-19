'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { IdentityType, IdentityTypeTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { IdentityTypeFormSheet } from '@/components/organization/identity-type-form-sheet';

function identityTypeRevision(identityType: IdentityType): string {
  return [
    identityType.codeValueId,
    identityType.example ?? '',
    identityType.formatDescription ?? '',
    identityType.validationMessage ?? '',
    identityType.validationRegex ?? '',
    identityType.displayOrder ?? '',
    identityType.status ?? ''
  ].join('|');
}

export function IdentityTypeEditUrlPanel({
  identityTypes,
  template
}: {
  identityTypes: IdentityType[];
  template: IdentityTypeTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const identityType =
    editId != null ? identityTypes.find((row) => String(row.id) === editId) : undefined;
  const open = identityType != null;

  useEffect(() => {
    if (editId != null && editId !== '' && identityType == null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [editId, identityType, pathname, router, searchParams]);

  function handleOpenChange(next: boolean) {
    if (!next && editId != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  if (!identityType) {
    return null;
  }

  return (
    <IdentityTypeFormSheet
      key={`${identityType.id}:${identityTypeRevision(identityType)}`}
      open={open}
      onOpenChange={handleOpenChange}
      mode="edit"
      identityType={identityType}
      template={template}
    />
  );
}
