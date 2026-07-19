'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountNumberPreferenceTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AccountNumberPreferenceFormSheet } from '@/components/system/account-number-preference-form-sheet';
import type { AccountNumberFormatOfficeOption } from '@/components/system/account-number-format-structured-fields';

/** Opens the create preference sidebar when the URL contains `?create=1`. */
export function AccountNumberPreferenceCreateUrlPanel({
  template,
  structuredFormatsEnabled,
  officeOptions = []
}: {
  template: FineractAccountNumberPreferenceTemplate;
  structuredFormatsEnabled: boolean;
  officeOptions?: AccountNumberFormatOfficeOption[];
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
    <AccountNumberPreferenceFormSheet
      key={open ? 'create-open' : 'create-closed'}
      mode="create"
      open={open}
      onOpenChange={handleOpenChange}
      template={template}
      structuredFormatsEnabled={structuredFormatsEnabled}
      officeOptions={officeOptions}
    />
  );
}
