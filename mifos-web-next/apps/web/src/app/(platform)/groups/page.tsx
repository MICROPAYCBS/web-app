/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GroupsPageContent } from '@/components/groups/groups-page-content';
import { fetchGroupsList } from '@/lib/fineract/groups-list';
import { parseGroupsListQuery } from '@/lib/fineract/groups-list-query';
import { getServerSession } from '@/lib/session/server';

export default async function GroupsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('clients.list'))) {
    notFound();
  }

  const params = await searchParams;
  const query = parseGroupsListQuery(params);
  const initialPage = await fetchGroupsList(query);

  return <GroupsPageContent initialPage={initialPage} initialQuery={query} />;
}
