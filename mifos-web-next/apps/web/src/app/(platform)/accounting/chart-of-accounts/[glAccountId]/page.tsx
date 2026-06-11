/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlAccountDetailView } from '@/components/accounting/chart-of-accounts/gl-account-detail-view';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

export default async function GlAccountDetailPage({
  params
}: {
  params: Promise<{ glAccountId: string }>;
}) {
  const { glAccountId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa'))) {
    notFound();
  }

  const id = Number(glAccountId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const account = await getGlAccount(id);
  if (!account) {
    notFound();
  }

  return (
    <GlAccountDetailView
      account={account}
      canCreate={can(session, 'CREATE_GLACCOUNT')}
      canUpdate={can(session, 'UPDATE_GLACCOUNT')}
      canDelete={can(session, 'DELETE_GLACCOUNT')}
    />
  );
}
