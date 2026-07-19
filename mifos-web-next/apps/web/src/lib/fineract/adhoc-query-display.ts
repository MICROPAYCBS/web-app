/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AdhocQueryListItem, FineractEnumOption } from '@mifos/api-client';

export function resolveReportRunFrequencyLabel(
  frequencyId: number | string | undefined,
  options?: FineractEnumOption[]
): string {
  if (frequencyId == null || frequencyId === '') {
    return '—';
  }
  const id = Number(frequencyId);
  if (!Number.isFinite(id)) {
    return String(frequencyId);
  }
  const match = options?.find((option) => option.id === id);
  return match?.value ?? match?.name ?? String(frequencyId);
}

export function enrichAdhocQueryListItem(row: AdhocQueryListItem): AdhocQueryListItem {
  return {
    ...row,
    reportRunFrequencyLabel: resolveReportRunFrequencyLabel(
      row.reportRunFrequency,
      row.reportRunFrequencies
    )
  };
}

export function formatAdhocQueryActive(isActive?: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}
