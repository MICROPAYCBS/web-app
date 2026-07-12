import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';
import type { ApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-match';
import {
  loadResourcePendingCheckerActions,
  resolveResourcePendingWorkflowContext,
  type ResourcePendingWorkflowContext
} from '@/lib/fineract/resource-pending-checker';
import {
  loanAccountPendingCheckerScope,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';
import { getWorkflowInstanceByCommandSourceId } from '@/lib/fineract/workflow-instances';

export type LoanAccountPendingCheckerAction = ResourcePendingCheckerAction;

export type LoanPendingApprovalWorkflowContext = ResourcePendingWorkflowContext & {
  matchedWorkflow?: CheckerInboxMatchedWorkflow;
  workflowInstance?: Awaited<ReturnType<typeof getWorkflowInstanceByCommandSourceId>>;
};

export {
  loanPendingCheckerActionsFromAudits,
  mergeLoanPendingCheckerActions
} from '@/lib/fineract/loan-account-pending-checker-filters';

export async function loadLoanAccountPendingCheckerActions(
  loanAccountId: number,
  auditEntries: FineractAuditTrailListItem[] = []
): Promise<LoanAccountPendingCheckerAction[]> {
  return loadResourcePendingCheckerActions(
    loanAccountPendingCheckerScope(loanAccountId),
    auditEntries
  );
}

export async function resolveLoanPendingApprovalWorkflowContext(
  actions: LoanAccountPendingCheckerAction[],
  loan: {
    id: number;
    status?: { code?: string; value?: string };
    approvedPrincipal?: number;
    proposedPrincipal?: number;
    principal?: number;
    currency?: { code?: string };
  },
  runtime: ApprovalWorkflowRuntimeContext
): Promise<LoanPendingApprovalWorkflowContext | undefined> {
  return resolveResourcePendingWorkflowContext(
    actions,
    loanAccountPendingCheckerScope(loan.id),
    {
      status: loan.status,
      amount: loan.approvedPrincipal ?? loan.proposedPrincipal ?? loan.principal,
      currencyCode: loan.currency?.code
    },
    runtime
  );
}
