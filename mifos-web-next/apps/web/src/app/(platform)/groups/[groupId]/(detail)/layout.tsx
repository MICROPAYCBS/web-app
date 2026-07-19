/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GroupDetailShell } from '@/components/groups/group-detail-shell';
import { getGroup } from '@/lib/fineract/groups';
import { getServerSession } from '@/lib/session/server';

export default async function GroupDetailLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('clients.list'))) {
    notFound();
  }

  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_GROUP');

  return (
    <GroupDetailShell group={group} canEdit={canEdit}>
      {children}
    </GroupDetailShell>
  );
}
