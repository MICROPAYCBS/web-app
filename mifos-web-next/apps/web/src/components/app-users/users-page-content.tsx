'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { UsersTable } from '@/components/app-users/users-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function UsersPageContent({
  users,
  canUpdate
}: {
  users: FineractUserListItem[];
  canUpdate: boolean;
}) {
  return (
    <ListPage
      title="Users"
      description="Manage application users, offices, and role assignments."
      actions={
        <Can permission="CREATE_USER">
          <Link href="/appusers/create" className={cn(buttonVariants())}>
            Create user
          </Link>
        </Can>
      }
    >
      <UsersTable users={users} canUpdate={canUpdate} />
    </ListPage>
  );
}
