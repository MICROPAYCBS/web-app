/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { HookDetailView } from '@/components/system/hook-detail-view';
import { getHook } from '@/lib/fineract/hooks';
import { getServerSession } from '@/lib/session/server';

export default async function HookDetailPage({
  params
}: {
  params: Promise<{ hookId: string }>;
}) {
  const { hookId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.hooks'))) {
    notFound();
  }

  const id = Number(hookId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const hook = await getHook(id);
  if (!hook) {
    notFound();
  }

  return (
    <HookDetailView
      hook={hook}
      canUpdate={can(session, 'UPDATE_HOOK')}
      canDelete={can(session, 'DELETE_HOOK')}
    />
  );
}
