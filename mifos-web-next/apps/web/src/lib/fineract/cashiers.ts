import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeCashier(raw: unknown): OrganizationCashierListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    staffId: row.staffId != null ? Number(row.staffId) : undefined,
    staffName: typeof row.staffName === 'string' ? row.staffName : undefined,
    tellerId: row.tellerId != null ? Number(row.tellerId) : undefined,
    tellerName: typeof row.tellerName === 'string' ? row.tellerName : undefined,
    startDate: row.startDate as number[] | string | undefined,
    endDate: row.endDate as number[] | string | undefined,
    isFullDay: row.isFullDay === true
  };
}

export async function listOrganizationCashiers(
  tellerId: string | number
): Promise<OrganizationCashierListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/tellers/${tellerId}/cashiers`);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeCashier(item))
    .filter((item): item is OrganizationCashierListItem => item !== null);
}
