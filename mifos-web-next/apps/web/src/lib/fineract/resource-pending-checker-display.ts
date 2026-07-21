/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDateTimeValue } from '@/lib/fineract/dates';
import { formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';

export type ResourcePendingCheckerEntity = 'LOAN' | 'SAVINGSACCOUNT' | 'CLIENT' | 'SHAREACCOUNT';

export type ResourcePendingCheckerAction = {
  id: number;
  actionName?: string;
  entityName?: string;
  maker?: string;
  madeOnDate?: FineractDateTimeValue;
};

export type ResourcePendingCheckerInboxFilters = {
  resourceId: number;
  clientId?: number;
  loanId?: number;
  savingsAccountId?: number;
};

export type ResourcePendingCheckerScope = {
  entityName: ResourcePendingCheckerEntity;
  resourceId: number;
  inboxFilters: ResourcePendingCheckerInboxFilters;
  /** User-facing noun for banner copy (e.g. "loan", "savings account"). */
  resourceLabel: string;
};

export const CLIENT_CHECKER_ENTITY: ResourcePendingCheckerEntity = 'CLIENT';
export const SAVINGS_ACCOUNT_CHECKER_ENTITY: ResourcePendingCheckerEntity = 'SAVINGSACCOUNT';
export const LOAN_ACCOUNT_CHECKER_ENTITY: ResourcePendingCheckerEntity = 'LOAN';
export const SHARE_ACCOUNT_CHECKER_ENTITY: ResourcePendingCheckerEntity = 'SHAREACCOUNT';

export function clientPendingCheckerScope(clientId: number): ResourcePendingCheckerScope {
  return {
    entityName: CLIENT_CHECKER_ENTITY,
    resourceId: clientId,
    inboxFilters: { resourceId: clientId, clientId },
    resourceLabel: 'customer'
  };
}

export function savingsAccountPendingCheckerScope(
  accountId: number
): ResourcePendingCheckerScope {
  return {
    entityName: SAVINGS_ACCOUNT_CHECKER_ENTITY,
    resourceId: accountId,
    inboxFilters: { resourceId: accountId, savingsAccountId: accountId },
    resourceLabel: 'savings account'
  };
}

export function loanAccountPendingCheckerScope(loanAccountId: number): ResourcePendingCheckerScope {
  return {
    entityName: LOAN_ACCOUNT_CHECKER_ENTITY,
    resourceId: loanAccountId,
    inboxFilters: { resourceId: loanAccountId, loanId: loanAccountId },
    resourceLabel: 'loan'
  };
}

export function shareAccountPendingCheckerScope(
  accountId: number
): ResourcePendingCheckerScope {
  return {
    entityName: SHARE_ACCOUNT_CHECKER_ENTITY,
    resourceId: accountId,
    inboxFilters: { resourceId: accountId },
    resourceLabel: 'share account'
  };
}

function normalizeCheckerActionName(actionName?: string): string {
  return actionName?.trim().toUpperCase().replace(/\s+/g, '') ?? '';
}

export function hasPendingCheckerAction(
  actions: ResourcePendingCheckerAction[],
  actionName: string
): boolean {
  const needle = normalizeCheckerActionName(actionName);
  return actions.some((item) => normalizeCheckerActionName(item.actionName) === needle);
}

function isLoanPendingStatus(status?: { code?: string; value?: string }): boolean {
  const code = status?.code ?? '';
  const value = status?.value ?? '';
  return (
    code.includes('submitted.and.pending') || value === 'Submitted and pending approval'
  );
}

function isLoanApprovedStatus(status?: { code?: string; value?: string }): boolean {
  const code = status?.code ?? '';
  const value = status?.value ?? '';
  return code.includes('approved') || value === 'Approved';
}

function isSavingsPendingStatus(status?: { code?: string; value?: string }): boolean {
  const code = status?.code ?? '';
  return code === 'savingsAccountStatusType.submitted.and.pending.approval';
}

function isSavingsApprovedStatus(status?: { code?: string; value?: string }): boolean {
  const code = status?.code ?? '';
  return code === 'savingsAccountStatusType.approved';
}

function isClientPendingStatus(status?: { code?: string; value?: string }): boolean {
  const value = status?.value?.trim().toLowerCase() ?? '';
  const code = status?.code?.trim().toLowerCase() ?? '';
  return value === 'pending' || code.includes('pending');
}

/** Lifecycle order for choosing which queued command drives the banner and workflow. */
export function preferredPendingCheckerActionsForStatus(
  entityName: ResourcePendingCheckerEntity,
  status?: { code?: string; value?: string }
): string[] {
  if (entityName === LOAN_ACCOUNT_CHECKER_ENTITY) {
    if (isLoanPendingStatus(status)) {
      return ['APPROVE', 'CREATE', 'REJECT', 'WITHDRAWNBYAPPLICANT', 'UPDATE'];
    }
    if (isLoanApprovedStatus(status)) {
      return ['DISBURSE', 'DISBURSETOSAVINGS', 'UNDOAPPROVAL', 'REJECT', 'WITHDRAWNBYAPPLICANT'];
    }
    return [
      'APPROVE',
      'DISBURSE',
      'DISBURSETOSAVINGS',
      'CREATE',
      'UPDATE',
      'REJECT',
      'WITHDRAWNBYAPPLICANT'
    ];
  }

  if (entityName === SAVINGS_ACCOUNT_CHECKER_ENTITY) {
    if (isSavingsPendingStatus(status)) {
      return ['APPROVE', 'CREATE', 'REJECT', 'WITHDRAWNBYAPPLICANT', 'UPDATE'];
    }
    if (isSavingsApprovedStatus(status)) {
      return ['ACTIVATE', 'UNDOAPPROVAL', 'REJECT', 'WITHDRAWNBYAPPLICANT'];
    }
    return ['APPROVE', 'ACTIVATE', 'CREATE', 'UPDATE', 'REJECT', 'WITHDRAWNBYAPPLICANT'];
  }

  if (isClientPendingStatus(status)) {
    return ['ACTIVATE', 'CREATE', 'UPDATE', 'REJECT', 'WITHDRAW', 'DELETE'];
  }

  return [
    'ACTIVATE',
    'REACTIVATE',
    'CLOSE',
    'UPDATESAVINGSACCOUNT',
    'ASSIGNSTAFF',
    'UPDATE',
    'CREATE'
  ];
}

export function resolvePrimaryPendingCheckerAction(
  actions: ResourcePendingCheckerAction[],
  entityName: ResourcePendingCheckerEntity,
  status?: { code?: string; value?: string }
): ResourcePendingCheckerAction | undefined {
  if (actions.length === 0) {
    return undefined;
  }
  if (actions.length === 1) {
    return actions[0];
  }

  const preferred = preferredPendingCheckerActionsForStatus(entityName, status);
  for (const actionName of preferred) {
    const match = actions.find(
      (item) => normalizeCheckerActionName(item.actionName) === actionName
    );
    if (match) {
      return match;
    }
  }

  return actions[0];
}

export function describePendingCheckerAction(
  action: Pick<ResourcePendingCheckerAction, 'actionName' | 'madeOnDate'>
): string {
  const actionLabel = action.actionName
    ? formatAuditTrailFilterLabel(action.actionName)
    : 'Change';
  return `${actionLabel} awaiting checker review`;
}

export function resourcePendingCheckerStatusMessage(resourceLabel: string): string {
  return `The ${resourceLabel} status will update after a checker approves this in the maker-checker inbox.`;
}
