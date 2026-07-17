/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ApprovalWorkflowsPageContent } from '@/components/system/approval-workflows/approval-workflows-page-content';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { ENABLE_APPROVAL_WORKFLOWS_CONFIG_NAME } from '@/lib/fineract/approval-workflow-paths';
import { listWorkflowDefinitions } from '@/lib/fineract/approval-workflows';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function ApprovalWorkflowsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.approvalWorkflows'))) {
    notFound();
  }

  const [definitionsResult, taskPermissions, engineConfiguration] = await Promise.all([
    tryFineractLoad(() => listWorkflowDefinitions(), 'Could not load approval workflows.'),
    listMakerCheckerPermissions().catch(() => []),
    getGlobalConfigurationByName(ENABLE_APPROVAL_WORKFLOWS_CONFIG_NAME)
  ]);

  if (!definitionsResult.ok) {
    return (
      <ListPage title="Approval workflows">
        <LoadErrorAlert title="Could not load approval workflows" message={definitionsResult.message} />
      </ListPage>
    );
  }

  return (
    <ApprovalWorkflowsPageContent
      definitions={definitionsResult.data ?? []}
      taskPermissions={taskPermissions}
      engineConfiguration={engineConfiguration}
      canUpdateConfiguration={can(session, 'UPDATE_CONFIGURATION')}
      canUpdate={can(session, 'UPDATE_WORKFLOW_DEFINITION')}
      canDelete={can(session, 'DELETE_WORKFLOW_DEFINITION')}
    />
  );
}
