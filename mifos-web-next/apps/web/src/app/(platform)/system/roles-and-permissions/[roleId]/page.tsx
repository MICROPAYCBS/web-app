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
import { RoleDetailView } from '@/components/system/role-detail-view';
import { RoleEditUrlPanel } from '@/components/system/role-edit-url-panel';
import { isSuperUserRole } from '@/lib/fineract/role-display';
import { getRolePermissions } from '@/lib/fineract/system-roles';
import { getServerSession } from '@/lib/session/server';

export default async function RoleDetailPage({
  params
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.roles'))) {
    notFound();
  }

  const id = Number(roleId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const role = await getRolePermissions(id);
  if (!role) {
    notFound();
  }

  const canUpdate = can(session, 'UPDATE_ROLE') && !isSuperUserRole(role.name);

  return (
    <>
      <RoleDetailView
        role={role}
        canUpdate={can(session, 'UPDATE_ROLE')}
        canDelete={can(session, 'DELETE_ROLE')}
      />
      {canUpdate ? (
        <Suspense fallback={null}>
          <RoleEditUrlPanel
            roleId={role.id}
            initial={{ name: role.name, description: role.description }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
