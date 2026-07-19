/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ApprovalWorkflowWizardPageContent } from '@/components/system/approval-workflows/approval-workflow-wizard-page-content';
import { defaultWorkflowDefinitionFormValues } from '@/lib/fineract/approval-workflow-display';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { listRoles } from '@/lib/fineract/system-roles';
import { getServerSession } from '@/lib/session/server';

export default async function CreateApprovalWorkflowPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.approvalWorkflows')) || !can(session, 'CREATE_WORKFLOW_DEFINITION')) {
    notFound();
  }

  const [taskPermissions, roles] = await Promise.all([
    listMakerCheckerPermissions(),
    listRoles().catch(() => [])
  ]);

  return (
    <ApprovalWorkflowWizardPageContent
      mode="create"
      initialValues={defaultWorkflowDefinitionFormValues()}
      taskPermissions={taskPermissions}
      roles={roles}
    />
  );
}
