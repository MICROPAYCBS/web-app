'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupsPage } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { GroupsTable } from '@/components/groups/groups-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { groupCreatePath } from '@/lib/fineract/group-paths';
import type { GroupsListQuery } from '@/lib/fineract/groups-list-query';
import { cn } from '@/lib/utils';

export function GroupsPageContent({
  initialPage,
  initialQuery
}: {
  initialPage: GroupsPage;
  initialQuery: GroupsListQuery;
}) {
  return (
    <ListPage
      title="Groups"
      description="Browse and manage groups for group lending."
      actions={
        <Can permission="CREATE_GROUP">
          <Link href={groupCreatePath()} className={cn(buttonVariants())}>
            New group
          </Link>
        </Can>
      }
    >
      <GroupsTable initialPage={initialPage} initialQuery={initialQuery} />
    </ListPage>
  );
}
