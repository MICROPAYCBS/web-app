/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractRolePermissionUsage,
  WorkflowDefinition
} from '@mifos/api-client';
import type { CheckerInboxMatchedWorkflow } from '@/lib/checker-inbox/checker-inbox-item-types';

export type ApprovalWorkflowRuntimeContext = {
  workflowsEnabled: boolean;
  activeDefinitions: WorkflowDefinition[];
  makerCheckerPermissions: FineractRolePermissionUsage[];
};

function normalizePermissionToken(value?: string): string {
  return value?.trim().toUpperCase().replace(/\s+/g, '') ?? '';
}

/** Map a queued maker-checker row to its Fineract permission code (e.g. CREATE_LOAN). */
export function resolveMakerCheckerTaskPermissionCode(
  permissions: FineractRolePermissionUsage[],
  actionName?: string,
  entityName?: string
): string | undefined {
  const action = normalizePermissionToken(actionName);
  const entity = normalizePermissionToken(entityName);
  if (!action || !entity) {
    return undefined;
  }

  const direct = permissions.find(
    (permission) =>
      normalizePermissionToken(permission.actionName) === action &&
      normalizePermissionToken(permission.entityName) === entity
  );
  if (direct) {
    return direct.code;
  }

  const conventional = `${action}_${entity}`;
  if (permissions.some((permission) => permission.code === conventional)) {
    return conventional;
  }

  return undefined;
}

export function workflowDefinitionHasSelectionCriteria(definition: WorkflowDefinition): boolean {
  return (
    definition.currencyCode != null ||
    definition.minAmount != null ||
    definition.maxAmount != null
  );
}

/** Mirrors {@code WorkflowDefinition.matches} in the Fineract workflow module. */
export function workflowDefinitionMatchesTransaction(
  definition: WorkflowDefinition,
  amount: number | undefined,
  currencyCode: string | undefined
): boolean {
  if (definition.currencyCode == null) {
    return definition.minAmount == null && definition.maxAmount == null;
  }
  if (currencyCode == null || definition.currencyCode !== currencyCode) {
    return false;
  }
  if (amount == null) {
    return definition.minAmount == null && definition.maxAmount == null;
  }
  if (definition.minAmount != null && amount < definition.minAmount) {
    return false;
  }
  return definition.maxAmount == null || amount <= definition.maxAmount;
}

/** Mirrors {@code WorkflowSelectionServiceImpl.selectWorkflow}. */
export function selectApprovalWorkflowDefinition(
  definitions: WorkflowDefinition[],
  taskPermissionCode: string,
  amount: number | undefined,
  currencyCode: string | undefined,
  workflowsEnabled: boolean
): WorkflowDefinition | undefined {
  if (!workflowsEnabled) {
    return undefined;
  }

  const activeDefinitions = definitions
    .filter(
      (definition) =>
        definition.status === 'ACTIVE' && definition.taskPermissionCode === taskPermissionCode
    )
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

  const criteriaMatch = activeDefinitions.find(
    (definition) =>
      workflowDefinitionHasSelectionCriteria(definition) &&
      workflowDefinitionMatchesTransaction(definition, amount, currencyCode)
  );
  if (criteriaMatch) {
    return criteriaMatch;
  }

  return activeDefinitions.find((definition) => !workflowDefinitionHasSelectionCriteria(definition));
}

export function extractCheckerCommandAmountAndCurrency(commandAsJson?: string): {
  amount?: number;
  currencyCode?: string;
} {
  if (!commandAsJson?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(commandAsJson) as Record<string, unknown>;
    const amountKeys = [
      'approvedLoanAmount',
      'transactionAmount',
      'amount',
      'principal',
      'proposedPrincipal'
    ] as const;

    let amount: number | undefined;
    for (const key of amountKeys) {
      const value = parsed[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        amount = value;
        break;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsedAmount = Number(value);
        if (Number.isFinite(parsedAmount)) {
          amount = parsedAmount;
          break;
        }
      }
    }

    const currencyValue = parsed.currency;
    const currencyCode =
      typeof currencyValue === 'string'
        ? currencyValue
        : currencyValue &&
            typeof currencyValue === 'object' &&
            typeof (currencyValue as { code?: string }).code === 'string'
          ? (currencyValue as { code: string }).code
          : typeof parsed.currencyCode === 'string'
            ? parsed.currencyCode
            : undefined;

    return { amount, currencyCode };
  } catch {
    return {};
  }
}

export function matchApprovalWorkflowForCheckerItem(
  options: {
    actionName?: string;
    entityName?: string;
    commandAsJson?: string;
    amount?: number;
    currencyCode?: string;
  },
  runtime: ApprovalWorkflowRuntimeContext
): CheckerInboxMatchedWorkflow | undefined {
  const taskPermissionCode = resolveMakerCheckerTaskPermissionCode(
    runtime.makerCheckerPermissions,
    options.actionName,
    options.entityName
  );
  if (!taskPermissionCode) {
    return undefined;
  }

  const fromCommand = extractCheckerCommandAmountAndCurrency(options.commandAsJson);
  const amount = options.amount ?? fromCommand.amount;
  const currencyCode = options.currencyCode ?? fromCommand.currencyCode;

  const definition = selectApprovalWorkflowDefinition(
    runtime.activeDefinitions,
    taskPermissionCode,
    amount,
    currencyCode,
    runtime.workflowsEnabled
  );
  if (!definition) {
    return undefined;
  }

  return {
    definition,
    taskPermissionCode
  };
}
