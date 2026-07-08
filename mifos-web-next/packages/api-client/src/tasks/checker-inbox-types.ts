/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Approve/reject response union for POST /makercheckers/{auditId}?command=approve|reject */
export type MakerCheckerCommandOutcome =
  | 'classic_completed'
  | 'workflow_stage_recorded'
  | 'workflow_stage_rejection'
  | 'workflow_terminal_completed';

export type MakerCheckerApproveResponse = {
  commandId?: number;
  loanId?: number;
  clientId?: number;
  resourceId?: number;
  rollbackTransaction?: boolean;
  changes?: Record<string, unknown>;
};

export interface CheckerInboxListItem {
  id: number;
  resourceId?: number;
  processingResult?: string;
  maker?: string;
  actionName?: string;
  entityName?: string;
  officeName?: string;
  madeOnDate?: string | number[] | number;
}

export interface CheckerInboxSearchTemplate {
  actionNames: string[];
  entityNames: string[];
}

export type CheckerInboxActionCommand = 'approve' | 'reject';
