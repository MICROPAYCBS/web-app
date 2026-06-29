/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session/server';

/** Edit opens as a side panel on the role detail view (`?edit=1`). */
export default async function EditRolePage({
  params
}: {
  params: Promise<{ roleId: string }>;
}): Promise<never> {
  const { roleId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('system.roles')) || !can(session, 'UPDATE_ROLE')) {
    notFound();
  }

  if (!Number.isFinite(Number(roleId))) {
    notFound();
  }

  redirect(`/system/roles-and-permissions/${roleId}?edit=1`);
}
