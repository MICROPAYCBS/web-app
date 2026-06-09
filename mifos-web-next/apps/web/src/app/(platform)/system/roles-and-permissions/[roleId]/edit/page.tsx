/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { can, resolvePermission } from '@mifos/auth';

import { notFound } from 'next/navigation';

import { DetailBackLink } from '@/components/composites';

import { ListPage } from '@/components/composites/list-page';

import { RoleEditForm } from '@/components/system/role-edit-form';

import { isSuperUserRole } from '@/lib/fineract/role-display';

import { getRolePermissions } from '@/lib/fineract/system-roles';

import { getServerSession } from '@/lib/session/server';



export default async function EditRolePage({

  params

}: {

  params: Promise<{ roleId: string }>;

}) {

  const { roleId } = await params;

  const session = await getServerSession();

  if (!can(session, resolvePermission('system.roles')) || !can(session, 'UPDATE_ROLE')) {

    notFound();

  }



  const id = Number(roleId);

  if (!Number.isFinite(id)) {

    notFound();

  }



  const role = await getRolePermissions(id);

  if (!role || isSuperUserRole(role.name)) {

    notFound();

  }



  return (

    <ListPage

      backLink={

        <DetailBackLink

          href={`/system/roles-and-permissions/${role.id}`}

          label="Back to role"

        />

      }

      title={`Edit role: ${role.name}`}

      description="Update the role description. Role names cannot be changed after creation."

    >

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">

        <RoleEditForm role={role} />

      </div>

    </ListPage>

  );

}

