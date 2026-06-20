/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { EditGroupPageContent } from '@/components/groups/edit-group-page-content';
import { getGroupEditTemplate } from '@/lib/fineract/groups';
import { getServerSession } from '@/lib/session/server';

export default async function EditGroupPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, 'UPDATE_GROUP')) {
    notFound();
  }

  const { groupId } = await params;
  const group = await getGroupEditTemplate(groupId);
  if (!group) {
    notFound();
  }

  return <EditGroupPageContent group={group} />;
}
