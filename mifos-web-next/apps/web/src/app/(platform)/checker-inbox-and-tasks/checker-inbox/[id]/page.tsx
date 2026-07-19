/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CheckerInboxDetailView } from '@/components/tasks/checker-inbox-detail-view';
import { enrichCheckerInboxDetail } from '@/lib/checker-inbox/enrich-checker-inbox-items';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { getCheckerInboxDetail } from '@/lib/fineract/checker-inbox';
import { getServerSession } from '@/lib/session/server';

export default async function CheckerInboxDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('checkerInbox'))) {
    notFound();
  }

  const { id } = await params;
  const checkerId = Number(id);
  if (!Number.isFinite(checkerId)) {
    notFound();
  }

  const [item, workflowRuntime] = await Promise.all([
    getCheckerInboxDetail(checkerId),
    loadApprovalWorkflowRuntimeContext()
  ]);
  if (!item) {
    notFound();
  }

  const context = await enrichCheckerInboxDetail(item, workflowRuntime);

  return (
    <CheckerInboxDetailView
      item={item}
      context={context}
      taskPermissions={workflowRuntime.makerCheckerPermissions}
    />
  );
}
