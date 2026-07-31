/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { UserDetailView } from '@/components/app-users/user-detail-view';
import { getUser } from '@/lib/fineract/app-users';
import { getServerSession } from '@/lib/session/server';

export default async function AppUserDetailPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.users'))) {
    notFound();
  }

  const id = Number(userId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const user = await getUser(id);
  if (!user) {
    notFound();
  }

  return (
    <UserDetailView
      user={user}
      canUpdate={can(session, 'UPDATE_USER')}
      canDelete={can(session, 'DELETE_USER')}
      canResetTotp={can(session, resolvePermission('administration.users.resetTotp'))}
    />
  );
}
