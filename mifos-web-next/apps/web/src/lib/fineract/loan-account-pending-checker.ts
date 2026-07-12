import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, WorkflowInstance } from '@mifos/api-client';
import {
  matchApprovalWorkflowForCheckerItem,
  resolveMakerCheckerTaskPermissionCode,
  type ApprovalWorkflowRuntimeContext
} from '@/lib/checker-inbox/approval-workflow-match';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';
import { listLoanAccountPendingCheckerActions } from '@/lib/fineract/checker-inbox';
import {
  loanPendingCheckerActionsFromAudits,
  mergeLoanPendingCheckerActions
} from '@/lib/fineract/loan-account-pending-checker-filters';
import type { LoanAccountPendingCheckerAction } from '@/lib/fineract/loan-account-pending-checker-display';
import { resolvePrimaryLoanPendingCheckerAction } from '@/lib/fineract/loan-account-pending-checker-display';
import { getWorkflowInstanceByCommandSourceId } from '@/lib/fineract/workflow-instances';

export type LoanPendingApprovalWorkflowContext = {
  approvalWorkflowsEnabled?: boolean;
  matchedWorkflow?: CheckerInboxMatchedWorkflow;
  unresolvedTaskPermissionCode?: string;
  workflowInstance?: WorkflowInstance | null;
};

export { loanPendingCheckerActionsFromAudits, mergeLoanPendingCheckerActions } from '@/lib/fineract/loan-account-pending-checker-filters';

export async function loadLoanAccountPendingCheckerActions(
  loanAccountId: number,
  auditEntries: FineractAuditTrailListItem[] = []
): Promise<LoanAccountPendingCheckerAction[]> {
  const [inbox, audits] = await Promise.all([
    listLoanAccountPendingCheckerActions(loanAccountId),
    Promise.resolve(loanPendingCheckerActionsFromAudits(auditEntries, loanAccountId))
  ]);
  return mergeLoanPendingCheckerActions(inbox, audits);
}

export async function resolveLoanPendingApprovalWorkflowContext(
  actions: LoanAccountPendingCheckerAction[],
  loan: {
    status?: { code?: string; value?: string };
    approvedPrincipal?: number;
    proposedPrincipal?: number;
    principal?: number;
    currency?: { code?: string };
  },
  runtime: ApprovalWorkflowRuntimeContext
): Promise<LoanPendingApprovalWorkflowContext | undefined> {
  if (actions.length === 0) {
    return runtime.workflowsEnabled ? { approvalWorkflowsEnabled: true } : undefined;
  }
  if (!runtime.workflowsEnabled) {
    return { approvalWorkflowsEnabled: true };
  }

  const workflowRows = await Promise.all(
    actions.map(async (action) => ({
      action,
      workflowInstance: await getWorkflowInstanceByCommandSourceId(action.id).catch(() => null)
    }))
  );

  const inProgressRow = workflowRows.find(
    (row) => row.workflowInstance?.status === 'IN_PROGRESS'
  );
  const action =
    inProgressRow?.action ??
    resolvePrimaryLoanPendingCheckerAction(actions, loan.status) ??
    actions[0];
  const workflowInstance =
    inProgressRow?.workflowInstance ??
    workflowRows.find((row) => row.action.id === action?.id)?.workflowInstance ??
    null;

  if (!action) {
    return { approvalWorkflowsEnabled: true };
  }

  const amount = loan.approvedPrincipal ?? loan.proposedPrincipal ?? loan.principal;
  const currencyCode = loan.currency?.code;
  const matchedWorkflow = matchApprovalWorkflowForCheckerItem(
    {
      actionName: action.actionName,
      entityName: action.entityName ?? 'LOAN',
      amount,
      currencyCode
    },
    runtime
  );

  if (matchedWorkflow) {
    return {
      approvalWorkflowsEnabled: true,
      matchedWorkflow,
      workflowInstance
    };
  }

  return {
    approvalWorkflowsEnabled: true,
    unresolvedTaskPermissionCode: resolveMakerCheckerTaskPermissionCode(
      runtime.makerCheckerPermissions,
      action.actionName,
      action.entityName ?? 'LOAN'
    ),
    workflowInstance
  };
}
