'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';
import { ResourcePendingCheckerBanner } from '@/components/composites/resource-pending-checker-banner';
import { loanAccountPendingCheckerScope } from '@/lib/fineract/resource-pending-checker-display';
import type { LoanPendingApprovalWorkflowContext } from '@/lib/fineract/loan-account-pending-checker';
import type { LoanAccountPendingCheckerAction } from '@/lib/fineract/loan-account-pending-checker-display';

export function LoanAccountPendingCheckerBanner({
  actions,
  approvalWorkflowContext,
  taskPermissions = [],
  loanAccountId,
  loanStatus
}: {
  actions: LoanAccountPendingCheckerAction[];
  approvalWorkflowContext?: LoanPendingApprovalWorkflowContext;
  taskPermissions?: FineractRolePermissionUsage[];
  loanAccountId?: number;
  loanStatus?: { code?: string; value?: string };
}) {
  if (loanAccountId == null) {
    return null;
  }

  return (
    <ResourcePendingCheckerBanner
      scope={loanAccountPendingCheckerScope(loanAccountId)}
      actions={actions}
      approvalWorkflowContext={approvalWorkflowContext}
      taskPermissions={taskPermissions}
      status={loanStatus}
    />
  );
}
