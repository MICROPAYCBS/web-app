import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CheckerInboxActionCommand,
  CheckerInboxListItem,
  FineractAuditTrailDetail,
  FineractCommandProcessingResult
} from '@mifos/api-client';
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';
import { getAuditTrail } from '@/lib/fineract/audit-trails';
import { coerceFineractDateTime } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildCheckerInboxSearchParams } from '@/lib/fineract/checker-inbox-query';

const MAKER_CHECKERS_PATH = '/makercheckers';

function normalizeCheckerInboxListItem(raw: unknown): CheckerInboxListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    resourceId: Number.isFinite(Number(row.resourceId)) ? Number(row.resourceId) : undefined,
    processingResult: typeof row.processingResult === 'string' ? row.processingResult : undefined,
    maker: typeof row.maker === 'string' ? row.maker : undefined,
    actionName: typeof row.actionName === 'string' ? row.actionName : undefined,
    entityName: typeof row.entityName === 'string' ? row.entityName : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    madeOnDate: coerceFineractDateTime(row.madeOnDate)
  };
}

function normalizeCheckerInboxList(raw: unknown): CheckerInboxListItem[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)
      ? (raw as { pageItems: unknown[] }).pageItems
      : [];

  return rows
    .map((item) => normalizeCheckerInboxListItem(item))
    .filter((item): item is CheckerInboxListItem => item !== null);
}

export async function listCheckerInboxItems(
  filters: CheckerInboxSearchFilters = {}
): Promise<CheckerInboxListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    MAKER_CHECKERS_PATH,
    buildCheckerInboxSearchParams(filters)
  );
  return normalizeCheckerInboxList(raw);
}

/** Minimal Fineract fetch for header badge — same scope as the checker inbox list. */
export async function getCheckerInboxPendingCount(): Promise<number> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(MAKER_CHECKERS_PATH, { fields: 'id' });
  return normalizeCheckerInboxList(raw).length;
}

export async function getCheckerInboxDetail(
  checkerId: number
): Promise<FineractAuditTrailDetail | null> {
  return getAuditTrail(checkerId);
}

export async function executeCheckerInboxAction(
  checkerId: number,
  command: CheckerInboxActionCommand
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`${MAKER_CHECKERS_PATH}/${checkerId}`, {}, { command });
}

export async function deleteCheckerInboxItem(checkerId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${MAKER_CHECKERS_PATH}/${checkerId}`);
}

export type ResourcePendingCheckerAction = {
  id: number;
  actionName?: string;
  entityName?: string;
  maker?: string;
  madeOnDate?: CheckerInboxListItem['madeOnDate'];
};

function toResourcePendingCheckerAction(item: CheckerInboxListItem): ResourcePendingCheckerAction {
  return {
    id: item.id,
    actionName: item.actionName,
    entityName: item.entityName,
    maker: item.maker,
    madeOnDate: item.madeOnDate
  };
}

/** Pending maker-checker commands for a Fineract resource id (e.g. loan account id). */
export async function listPendingCheckerActionsForResource(
  resourceId: number,
  options?: { entityName?: string }
): Promise<ResourcePendingCheckerAction[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(MAKER_CHECKERS_PATH, {
    resourceId: String(resourceId),
    ...(options?.entityName ? { entityName: options.entityName } : {})
  });
  return normalizeCheckerInboxList(raw)
    .filter((item) => item.resourceId === resourceId)
    .map(toResourcePendingCheckerAction);
}

export async function listLoanAccountPendingCheckerActions(
  loanAccountId: number
): Promise<ResourcePendingCheckerAction[]> {
  try {
    return await listPendingCheckerActionsForResource(loanAccountId, { entityName: 'LOAN' });
  } catch {
    return [];
  }
}
