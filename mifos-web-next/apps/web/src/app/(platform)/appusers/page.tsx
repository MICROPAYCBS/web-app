/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { UsersPageContent } from '@/components/app-users/users-page-content';
import { listUsers } from '@/lib/fineract/app-users';
import { getServerSession } from '@/lib/session/server';

export default async function AppUsersPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.users'))) {
    notFound();
  }

  const users = await listUsers();

  return (
    <UsersPageContent users={users} canUpdate={can(session, 'UPDATE_USER')} />
  );
}
