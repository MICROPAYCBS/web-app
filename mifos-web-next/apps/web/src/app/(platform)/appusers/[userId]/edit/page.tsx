/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { UserEditPageContent } from '@/components/app-users/user-edit-page-content';
import { getUserForEdit } from '@/lib/fineract/app-users';
import { getServerSession } from '@/lib/session/server';

export default async function EditAppUserPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.users')) || !can(session, 'UPDATE_USER')) {
    notFound();
  }

  const id = Number(userId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const editContext = await getUserForEdit(id);
  if (!editContext) {
    notFound();
  }

  return <UserEditPageContent editContext={editContext} />;
}
