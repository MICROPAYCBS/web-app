/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RoleCreateUrlPanel } from '@/components/system/role-create-url-panel';
import { RolesPageContent } from '@/components/system/roles-page-content';
import { listRoles } from '@/lib/fineract/system-roles';
import { getServerSession } from '@/lib/session/server';

export default async function RolesAndPermissionsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.roles'))) {
    notFound();
  }

  const roles = await listRoles();
  const canCreate = can(session, 'CREATE_ROLE');

  return (
    <>
      <RolesPageContent roles={roles} canUpdate={can(session, 'UPDATE_ROLE')} />
      {canCreate ? (
        <Suspense fallback={null}>
          <RoleCreateUrlPanel />
        </Suspense>
      ) : null}
    </>
  );
}
