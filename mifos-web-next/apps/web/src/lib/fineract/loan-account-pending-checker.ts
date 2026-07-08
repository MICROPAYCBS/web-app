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
import { isPendingCheckerAuditResult } from '@/lib/fineract/audit-trail-display';
import { listLoanAccountPendingCheckerActions } from '@/lib/fineract/checker-inbox';
import type { LoanAccountPendingCheckerAction } from '@/lib/fineract/loan-account-pending-checker-display';
import { getWorkflowInstanceByCommandSourceId } from '@/lib/fineract/workflow-instances';

export type LoanPendingApprovalWorkflowContext = {
  approvalWorkflowsEnabled?: boolean;
  matchedWorkflow?: CheckerInboxMatchedWorkflow;
  unresolvedTaskPermissionCode?: string;
  workflowInstance?: WorkflowInstance | null;
};

function pendingFromAuditEntry(audit: FineractAuditTrailListItem): LoanAccountPendingCheckerAction {
  return {
    id: audit.id,
    actionName: audit.actionName,
    entityName: audit.entityName,
    maker: audit.maker,
    madeOnDate: audit.madeOnDate
  };
}

export function loanPendingCheckerActionsFromAudits(
  audits: FineractAuditTrailListItem[]
): LoanAccountPendingCheckerAction[] {
  return audits
    .filter((audit) => isPendingCheckerAuditResult(audit.processingResult))
    .map(pendingFromAuditEntry);
}

export function mergeLoanPendingCheckerActions(
  inbox: LoanAccountPendingCheckerAction[],
  audits: LoanAccountPendingCheckerAction[]
): LoanAccountPendingCheckerAction[] {
  const byId = new Map<number, LoanAccountPendingCheckerAction>();
  for (const item of [...inbox, ...audits]) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

export async function loadLoanAccountPendingCheckerActions(
  loanAccountId: number,
  auditEntries: FineractAuditTrailListItem[] = []
): Promise<LoanAccountPendingCheckerAction[]> {
  const [inbox, audits] = await Promise.all([
    listLoanAccountPendingCheckerActions(loanAccountId),
    Promise.resolve(loanPendingCheckerActionsFromAudits(auditEntries))
  ]);
  return mergeLoanPendingCheckerActions(inbox, audits);
}

export async function resolveLoanPendingApprovalWorkflowContext(
  action: LoanAccountPendingCheckerAction | undefined,
  loan: {
    approvedPrincipal?: number;
    proposedPrincipal?: number;
    principal?: number;
    currency?: { code?: string };
  },
  runtime: ApprovalWorkflowRuntimeContext
): Promise<LoanPendingApprovalWorkflowContext | undefined> {
  if (!action || !runtime.workflowsEnabled) {
    return runtime.workflowsEnabled ? { approvalWorkflowsEnabled: true } : undefined;
  }

  const workflowInstance = await getWorkflowInstanceByCommandSourceId(action.id).catch(() => null);
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
