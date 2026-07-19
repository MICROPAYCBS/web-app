import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupListItem, GroupsPage } from '@mifos/api-client';
import type { GroupsListQuery } from '@/lib/fineract/groups-list-query';
import { buildGroupsListApiQuery } from '@/lib/fineract/groups-list-query';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeGroupListItem(raw: unknown): GroupListItem | null {
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
        ? (row.status as GroupListItem['status'])
        : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    active: row.active === true
  };
}

export async function fetchGroupsList(query: GroupsListQuery): Promise<GroupsPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<GroupsPage>('/groups', buildGroupsListApiQuery(query));
  let pageItems = Array.isArray(raw.pageItems)
    ? raw.pageItems
        .map((item) => normalizeGroupListItem(item))
        .filter((item): item is GroupListItem => item !== null)
    : [];

  if (!query.includeClosed) {
    pageItems = pageItems.filter((group) => group.active !== false);
  }

  return {
    totalFilteredRecords: Number.isFinite(Number(raw.totalFilteredRecords))
      ? Number(raw.totalFilteredRecords)
      : pageItems.length,
    pageItems
  };
}
