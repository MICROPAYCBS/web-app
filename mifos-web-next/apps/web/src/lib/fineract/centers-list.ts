import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterListItem, CentersPage } from '@mifos/api-client';
import type { CentersListQuery } from '@/lib/fineract/centers-list-query';
import { buildCentersListApiQuery } from '@/lib/fineract/centers-list-query';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeCenterListItem(raw: unknown): CenterListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    status:
      row.status && typeof row.status === 'object'
        ? (row.status as CenterListItem['status'])
        : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    active: row.active === true
  };
}

export async function fetchCentersList(query: CentersListQuery): Promise<CentersPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<CentersPage>('/centers', buildCentersListApiQuery(query));
  let pageItems = Array.isArray(raw.pageItems)
    ? raw.pageItems
        .map((item) => normalizeCenterListItem(item))
        .filter((item): item is CenterListItem => item !== null)
    : [];

  if (!query.includeClosed) {
    pageItems = pageItems.filter((center) => center.active !== false);
  }

  return {
    totalFilteredRecords: Number.isFinite(Number(raw.totalFilteredRecords))
      ? Number(raw.totalFilteredRecords)
      : pageItems.length,
    pageItems
  };
}
