/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ApprovalWorkflowDetailView } from '@/components/system/approval-workflows/approval-workflow-detail-view';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { APPROVAL_WORKFLOWS_LIST_PATH } from '@/lib/fineract/approval-workflow-paths';
import { getWorkflowDefinition } from '@/lib/fineract/approval-workflows';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function ApprovalWorkflowDetailPage({
  params
}: {
  params: Promise<{ definitionId: string }>;
}) {
  const { definitionId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.approvalWorkflows'))) {
    notFound();
  }

  const [result, taskPermissions] = await Promise.all([
    tryFineractLoad(
      () => getWorkflowDefinition(Number(definitionId)),
      'Could not load approval workflow.'
    ),
    listMakerCheckerPermissions().catch(() => [])
  ]);

  if (!result.ok) {
    return (
      <ListPage title="Approval workflow">
        <LoadErrorAlert title="Could not load approval workflow" message={result.message} />
      </ListPage>
    );
  }

  if (!result.data) {
    notFound();
  }

  return (
    <ApprovalWorkflowDetailView
      definition={result.data}
      taskPermissions={taskPermissions}
    />
  );
}
