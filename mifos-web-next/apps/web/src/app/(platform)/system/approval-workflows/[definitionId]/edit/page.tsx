/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ApprovalWorkflowForm } from '@/components/system/approval-workflows/approval-workflow-form';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { approvalWorkflowDetailPath } from '@/lib/fineract/approval-workflow-paths';
import { workflowDefinitionToFormValues } from '@/lib/fineract/approval-workflow-display';
import { getWorkflowDefinition } from '@/lib/fineract/approval-workflows';
import { listMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listRoles } from '@/lib/fineract/system-roles';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function EditApprovalWorkflowPage({
  params
}: {
  params: Promise<{ definitionId: string }>;
}) {
  const { definitionId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.approvalWorkflows')) || !can(session, 'UPDATE_WORKFLOW_DEFINITION')) {
    notFound();
  }

  const [result, roles, currencies, taskPermissions] = await Promise.all([
    tryFineractLoad(() => getWorkflowDefinition(Number(definitionId)), 'Could not load approval workflow.'),
    listRoles(),
    getOrganizationSelectedCurrencies(),
    listMakerCheckerPermissions()
  ]);

  if (!result.ok || !result.data) {
    notFound();
  }

  if (result.data.status !== 'DRAFT') {
    notFound();
  }

  return (
    <ListPage
      backLink={
        <DetailBackLink
          href={approvalWorkflowDetailPath(definitionId)}
          label="Back to workflow details"
        />
      }
      title={`Edit ${result.data.name}`}
      description="Draft workflows can be fully replaced. Activate when the structure is ready."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ApprovalWorkflowForm
          mode="edit"
          definitionId={result.data.id}
          initialValues={workflowDefinitionToFormValues(result.data)}
          roles={roles}
          currencies={currencies}
          taskPermissions={taskPermissions}
        />
      </div>
    </ListPage>
  );
}
