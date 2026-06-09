/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function standingInstructionEnumLabel(option?: FineractEnumOption): string {
  if (!option) {
    return '—';
  }
  return option.value ?? option.name ?? option.code ?? String(option.id);
}

export function standingInstructionValidityLabel(
  validFrom?: number[] | string,
  validTill?: number[] | string
): string {
  const from =
    typeof validFrom === 'string'
      ? validFrom
      : formatFineractDateArray(validFrom) ?? '—';
  const till =
    typeof validTill === 'string'
      ? validTill
      : formatFineractDateArray(validTill) ?? '—';
  return `${from} to ${till}`;
}
