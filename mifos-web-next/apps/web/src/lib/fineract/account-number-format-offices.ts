/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';
import type { AccountNumberFormatOfficeOption } from '@/components/system/account-number-format-structured-fields';

export function toAccountNumberFormatOfficeOptions(
  offices: FineractOfficeListItem[]
): AccountNumberFormatOfficeOption[] {
  return offices
    .filter((office) => typeof office.id === 'number')
    .map((office) => ({
      id: office.id,
      label: office.nameDecorated?.trim() || office.name?.trim() || String(office.id)
    }));
}
