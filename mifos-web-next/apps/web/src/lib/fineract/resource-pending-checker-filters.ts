/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxListItem, FineractAuditTrailListItem } from '@mifos/api-client';
import { isPendingCheckerAuditResult } from '@/lib/fineract/audit-trail-display';
import type {
  ResourcePendingCheckerAction,
  ResourcePendingCheckerEntity,
  ResourcePendingCheckerScope
} from '@/lib/fineract/resource-pending-checker-display';

function normalizeEntityName(entityName?: string): string {
  return entityName?.trim().toUpperCase() ?? '';
}

export function filterAuditTrailsForResource(
  audits: FineractAuditTrailListItem[],
  scope: Pick<ResourcePendingCheckerScope, 'entityName' | 'resourceId'>
): FineractAuditTrailListItem[] {
  const resourceId = Number(scope.resourceId);
  if (!Number.isFinite(resourceId)) {
    return [];
  }
  const entityNeedle = scope.entityName;
  return audits.filter(
    (audit) =>
      audit.resourceId === resourceId &&
      normalizeEntityName(audit.entityName) === entityNeedle
  );
}

export function filterCheckerInboxItemsForResource(
  items: CheckerInboxListItem[],
  scope: Pick<ResourcePendingCheckerScope, 'entityName' | 'resourceId'>
): CheckerInboxListItem[] {
  const resourceId = Number(scope.resourceId);
  if (!Number.isFinite(resourceId)) {
    return [];
  }
  const entityNeedle = scope.entityName;
  return items.filter(
    (item) =>
      item.resourceId === resourceId &&
      normalizeEntityName(item.entityName) === entityNeedle
  );
}

function pendingFromAuditEntry(audit: FineractAuditTrailListItem): ResourcePendingCheckerAction {
  return {
    id: audit.id,
    actionName: audit.actionName,
    entityName: audit.entityName,
    maker: audit.maker,
    madeOnDate: audit.madeOnDate
  };
}

export function pendingCheckerActionsFromAudits(
  audits: FineractAuditTrailListItem[],
  scope: ResourcePendingCheckerScope
): ResourcePendingCheckerAction[] {
  return filterAuditTrailsForResource(audits, scope)
    .filter((audit) => isPendingCheckerAuditResult(audit.processingResult))
    .map(pendingFromAuditEntry);
}

export function mergePendingCheckerActions(
  inbox: ResourcePendingCheckerAction[],
  audits: ResourcePendingCheckerAction[]
): ResourcePendingCheckerAction[] {
  const byId = new Map<number, ResourcePendingCheckerAction>();
  for (const item of [...inbox, ...audits]) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

export function isResourcePendingCheckerEntity(
  value: string
): value is ResourcePendingCheckerEntity {
  return value === 'LOAN' || value === 'SAVINGSACCOUNT' || value === 'CLIENT';
}
