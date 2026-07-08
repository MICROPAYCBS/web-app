import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, FineractAuditTrailDetail } from '@mifos/api-client';
import {
  buildCheckerInboxSummary,
  checkerCommandHighlights
} from '@/lib/checker-inbox/checker-inbox-command-summary';
import {
  matchApprovalWorkflowForCheckerItem,
  resolveMakerCheckerTaskPermissionCode,
  type ApprovalWorkflowRuntimeContext
} from '@/lib/checker-inbox/approval-workflow-match';
import type {
  CheckerInboxEnrichedItem,
  CheckerInboxItemContext
} from '@/lib/checker-inbox/checker-inbox-item-types';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { getWorkflowInstanceByCommandSourceId } from '@/lib/fineract/workflow-instances';
import { getAuditTrail } from '@/lib/fineract/audit-trails';
import { centerDetailPath } from '@/lib/fineract/center-paths';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { groupDetailPath } from '@/lib/fineract/group-paths';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { loanAccountProductName } from '@/lib/fineract/loan-account-display';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';

type LoanAmountContext = {
  amount?: number;
  currencyCode?: string;
};

async function resolveLoanAccountContext(
  loanAccountId: number,
  audit: FineractAuditTrailDetail | null
): Promise<CheckerInboxItemContext & LoanAmountContext> {
  const loan = await getLoanAccount(loanAccountId).catch(() => null);
  const customerName = loan?.clientName?.trim() || audit?.clientName?.trim();
  const productName = loan ? loanAccountProductName(loan) : undefined;
  const accountNo = loan?.accountNo?.trim();
  const subjectLabel = productName || accountNo || `Loan #${loanAccountId}`;
  const href =
    loan?.clientId != null
      ? clientAccountGeneralPath(loan.clientId, 'loan', loanAccountId)
      : undefined;

  const loanAmount =
    loan?.approvedPrincipal ?? loan?.proposedPrincipal ?? loan?.principal ?? undefined;
  const loanCurrency = loan?.currency?.code;

  const amountHighlight = (() => {
    if (loanAmount == null) {
      return undefined;
    }
    return `Amount: ${formatAccountMoney(loanAmount, loanCurrency)}`;
  })();

  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);
  if (amountHighlight && !commandHighlights.some((line) => line.toLowerCase().includes('amount'))) {
    commandHighlights.unshift(amountHighlight);
  }

  return {
    href,
    hrefLabel: 'Open loan account',
    subjectLabel,
    customerName,
    commandHighlights,
    amount: loanAmount,
    currencyCode: loanCurrency,
    summary: buildCheckerInboxSummary({
      actionName: audit?.actionName,
      entityName: audit?.entityName ?? 'LOAN',
      subjectLabel,
      customerName,
      commandHighlights
    })
  };
}

async function resolveSavingsAccountContext(
  accountId: number,
  audit: FineractAuditTrailDetail | null
): Promise<CheckerInboxItemContext> {
  const account = await getSavingsAccount(accountId).catch(() => null);
  const clientId = account?.clientId;
  const customerName = account?.clientName?.trim() || audit?.clientName?.trim();
  const subjectLabel =
    account?.savingsProductName?.trim() ||
    account?.accountNo?.trim() ||
    audit?.savingsAccountNo?.trim() ||
    `Savings #${accountId}`;
  const href =
    clientId != null ? clientAccountGeneralPath(clientId, 'savings', accountId) : undefined;
  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);

  return {
    href,
    hrefLabel: 'Open savings account',
    subjectLabel,
    customerName,
    commandHighlights,
    summary: buildCheckerInboxSummary({
      actionName: audit?.actionName,
      entityName: audit?.entityName ?? 'SAVINGS',
      subjectLabel,
      customerName,
      commandHighlights
    })
  };
}

function resolveClientContext(
  clientId: number,
  audit: FineractAuditTrailDetail | null
): CheckerInboxItemContext {
  const customerName = audit?.clientName?.trim() || `Customer #${clientId}`;
  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);

  return {
    href: clientGeneralPath(clientId),
    hrefLabel: 'Open customer',
    subjectLabel: customerName,
    customerName,
    commandHighlights,
    summary: buildCheckerInboxSummary({
      actionName: audit?.actionName,
      entityName: audit?.entityName ?? 'CLIENT',
      subjectLabel: customerName,
      customerName,
      commandHighlights
    })
  };
}

function resolveGroupContext(
  groupId: number,
  audit: FineractAuditTrailDetail | null
): CheckerInboxItemContext {
  const subjectLabel = audit?.groupName?.trim() || `Group #${groupId}`;
  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);

  return {
    href: groupDetailPath(groupId),
    hrefLabel: 'Open group',
    subjectLabel,
    commandHighlights,
    summary: buildCheckerInboxSummary({
      actionName: audit?.actionName,
      entityName: audit?.entityName ?? 'GROUP',
      subjectLabel,
      commandHighlights
    })
  };
}

function resolveCenterContext(
  centerId: number,
  audit: FineractAuditTrailDetail | null
): CheckerInboxItemContext {
  const subjectLabel = audit?.groupName?.trim() || `Center #${centerId}`;
  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);

  return {
    href: centerDetailPath(centerId),
    hrefLabel: 'Open center',
    subjectLabel,
    commandHighlights,
    summary: buildCheckerInboxSummary({
      actionName: audit?.actionName,
      entityName: audit?.entityName ?? 'CENTER',
      subjectLabel,
      commandHighlights
    })
  };
}

function fallbackContext(
  item: CheckerInboxListItem,
  audit: FineractAuditTrailDetail | null
): CheckerInboxItemContext {
  const commandHighlights = checkerCommandHighlights(audit?.commandAsJson);
  const customerName = audit?.clientName?.trim();
  const subjectLabel =
    audit?.savingsAccountNo?.trim() ||
    (item.resourceId != null ? `${item.entityName ?? 'Resource'} #${item.resourceId}` : undefined);

  return {
    subjectLabel,
    customerName,
    commandHighlights,
    summary: buildCheckerInboxSummary({
      actionName: item.actionName,
      entityName: item.entityName,
      subjectLabel,
      customerName,
      commandHighlights
    })
  };
}

async function attachApprovalWorkflowContext(
  context: CheckerInboxItemContext & Partial<LoanAmountContext>,
  item: CheckerInboxListItem,
  audit: FineractAuditTrailDetail | null,
  runtime: ApprovalWorkflowRuntimeContext
): Promise<CheckerInboxItemContext> {
  const { amount, currencyCode, ...rest } = context;
  const actionName = item.actionName ?? audit?.actionName;
  const entityName = item.entityName ?? audit?.entityName;
  const taskPermissionCode = resolveMakerCheckerTaskPermissionCode(
    runtime.makerCheckerPermissions,
    actionName,
    entityName
  );

  const workflowInstance =
    runtime.workflowsEnabled && Number.isFinite(item.id)
      ? await getWorkflowInstanceByCommandSourceId(item.id).catch(() => null)
      : null;

  if (!runtime.workflowsEnabled) {
    return { ...rest, approvalWorkflowsEnabled: false, taskPermissionCode, workflowInstance };
  }

  const matchedWorkflow = matchApprovalWorkflowForCheckerItem(
    {
      actionName,
      entityName,
      commandAsJson: audit?.commandAsJson,
      amount,
      currencyCode
    },
    runtime
  );

  if (matchedWorkflow) {
    return {
      ...rest,
      approvalWorkflowsEnabled: true,
      matchedWorkflow,
      taskPermissionCode,
      workflowInstance
    };
  }

  return {
    ...rest,
    approvalWorkflowsEnabled: true,
    unresolvedTaskPermissionCode: taskPermissionCode,
    taskPermissionCode,
    workflowInstance
  };
}

async function resolveEntityContext(
  item: CheckerInboxListItem,
  audit: FineractAuditTrailDetail | null
): Promise<CheckerInboxItemContext & Partial<LoanAmountContext>> {
  const resourceId = item.resourceId ?? audit?.resourceId;
  const entity = item.entityName?.trim().toUpperCase() ?? audit?.entityName?.trim().toUpperCase();

  if (resourceId == null || !Number.isFinite(resourceId)) {
    return fallbackContext(item, audit);
  }

  switch (entity) {
    case 'LOAN':
      return resolveLoanAccountContext(resourceId, audit);
    case 'SAVINGS':
    case 'SAVING':
    case 'SAVINGSACCOUNT':
    case 'SAVINGS ACCOUNT':
      return resolveSavingsAccountContext(resourceId, audit);
    case 'CLIENT':
      return resolveClientContext(resourceId, audit);
    case 'GROUP':
      return resolveGroupContext(resourceId, audit);
    case 'CENTER':
      return resolveCenterContext(resourceId, audit);
    default:
      return fallbackContext(item, audit);
  }
}

export async function enrichCheckerInboxItem(
  item: CheckerInboxListItem,
  runtime?: ApprovalWorkflowRuntimeContext
): Promise<CheckerInboxEnrichedItem> {
  const audit = await getAuditTrail(item.id).catch(() => null);
  const workflowRuntime = runtime ?? (await loadApprovalWorkflowRuntimeContext());
  const context = await attachApprovalWorkflowContext(
    await resolveEntityContext(item, audit),
    item,
    audit,
    workflowRuntime
  );
  return { ...item, context };
}

export async function enrichCheckerInboxItems(
  items: CheckerInboxListItem[],
  runtime?: ApprovalWorkflowRuntimeContext
): Promise<CheckerInboxEnrichedItem[]> {
  const workflowRuntime = runtime ?? (await loadApprovalWorkflowRuntimeContext());
  return Promise.all(items.map((item) => enrichCheckerInboxItem(item, workflowRuntime)));
}

export async function enrichCheckerInboxDetail(
  item: FineractAuditTrailDetail,
  runtime?: ApprovalWorkflowRuntimeContext
): Promise<CheckerInboxItemContext> {
  const workflowRuntime = runtime ?? (await loadApprovalWorkflowRuntimeContext());
  return await attachApprovalWorkflowContext(await resolveEntityContext(item, item), item, item, workflowRuntime);
}
