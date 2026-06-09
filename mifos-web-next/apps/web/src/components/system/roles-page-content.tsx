'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRoleListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { RolesTable } from '@/components/system/roles-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RolesPageContent({
  roles,
  canUpdate
}: {
  roles: FineractRoleListItem[];
  canUpdate: boolean;
}) {
  return (
    <ListPage
      title="Roles and permissions"
      description="Define roles and control which actions users can perform across the application."
      actions={
        <Can permission="CREATE_ROLE">
          <Link
            href="/system/roles-and-permissions?create=1"
            className={cn(buttonVariants())}
          >
            Add role
          </Link>
        </Can>
      }
    >
      <RolesTable roles={roles} canUpdate={canUpdate} />
    </ListPage>
  );
}
