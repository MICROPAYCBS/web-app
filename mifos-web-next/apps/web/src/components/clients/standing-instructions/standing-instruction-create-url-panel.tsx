'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreateStandingInstructionSheet } from '@/components/clients/standing-instructions/create-standing-instruction-sheet';
import { standingInstructionFromAccountTypeParam } from '@/lib/fineract/standing-instruction-account-type';

/** Opens the create side panel when the URL contains `?create=1`. */
export function StandingInstructionCreateUrlPanel({
  clientId,
  fromOfficeId,
  initialTemplate
}: {
  clientId: string;
  fromOfficeId: number;
  initialTemplate: StandingInstructionTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get('create') === '1';

  const accountType =
    searchParams.get('accountType') ?? 'fromsavings';
  const fromAccountType = standingInstructionFromAccountTypeParam(accountType);

  const officeIdParam = searchParams.get('officeId');
  const parsedOfficeId = officeIdParam ? Number(officeIdParam) : NaN;
  const effectiveOfficeId =
    Number.isFinite(parsedOfficeId) && parsedOfficeId > 0 ? parsedOfficeId : fromOfficeId;

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('create') === '1') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('create');
      params.delete('officeId');
      params.delete('accountType');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <CreateStandingInstructionSheet
      clientId={clientId}
      fromOfficeId={effectiveOfficeId}
      fromAccountType={fromAccountType}
      initialTemplate={initialTemplate}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
}
