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
  CheckerInboxSearchTemplate
} from '@mifos/api-client';
import type { FineractAuditTrailDetail } from '@mifos/api-client';
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';
import { getAuditTrail } from '@/lib/fineract/audit-trails';
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
    madeOnDate:
      typeof row.madeOnDate === 'string' || Array.isArray(row.madeOnDate)
        ? (row.madeOnDate as string | number[])
        : undefined
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

function normalizeCheckerInboxSearchTemplate(raw: unknown): CheckerInboxSearchTemplate {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    actionNames: Array.isArray(row.actionNames)
      ? row.actionNames.filter((item): item is string => typeof item === 'string')
      : [],
    entityNames: Array.isArray(row.entityNames)
      ? row.entityNames.filter((item): item is string => typeof item === 'string')
      : []
  };
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

export async function getCheckerInboxSearchTemplate(): Promise<CheckerInboxSearchTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${MAKER_CHECKERS_PATH}/searchtemplate`);
  return normalizeCheckerInboxSearchTemplate(raw);
}

export async function getCheckerInboxDetail(
  checkerId: number
): Promise<FineractAuditTrailDetail | null> {
  return getAuditTrail(checkerId);
}

export async function executeCheckerInboxAction(
  checkerId: number,
  command: CheckerInboxActionCommand
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${MAKER_CHECKERS_PATH}/${checkerId}`, {}, { command });
}

export async function deleteCheckerInboxItem(checkerId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${MAKER_CHECKERS_PATH}/${checkerId}`);
}
