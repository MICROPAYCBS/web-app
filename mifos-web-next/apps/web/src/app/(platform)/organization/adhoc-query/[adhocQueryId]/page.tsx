/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AdhocQueryDetailView } from '@/components/organization/adhoc-query-detail-view';
import { getAdhocQuery } from '@/lib/fineract/adhoc-query';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationAdhocQueryDetailPage({
  params
}: {
  params: Promise<{ adhocQueryId: string }>;
}) {
  const { adhocQueryId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.adhocQuery'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_ADHOC');
  const canDelete = can(session, 'DELETE_ADHOC');

  let query;
  try {
    query = await getAdhocQuery(adhocQueryId);
  } catch {
    notFound();
  }

  return <AdhocQueryDetailView query={query} canEdit={canEdit} canDelete={canDelete} />;
}
