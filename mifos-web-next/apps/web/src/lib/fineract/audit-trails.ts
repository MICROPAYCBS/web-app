import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAuditTrailDetail,
  FineractAuditTrailListItem,
  FineractAuditTrailSearchTemplate,
  FineractAuditTrailUserOption,
  FineractAuditTrailsPage
} from '@mifos/api-client';
import {
  buildAuditTrailSearchParams,
  type AuditTrailListQuery
} from '@/lib/fineract/audit-trail-query';
import { coerceFineractDateTime, FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

const AUDITS_PATH = '/audits';

function normalizeAuditTrailListItem(raw: unknown): FineractAuditTrailListItem | null {
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
    subresourceId: Number.isFinite(Number(row.subresourceId))
      ? Number(row.subresourceId)
      : undefined,
    processingResult: typeof row.processingResult === 'string' ? row.processingResult : undefined,
    maker: typeof row.maker === 'string' ? row.maker : undefined,
    actionName: typeof row.actionName === 'string' ? row.actionName : undefined,
    entityName: typeof row.entityName === 'string' ? row.entityName : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    madeOnDate: coerceFineractDateTime(row.madeOnDate),
    checker: typeof row.checker === 'string' ? row.checker : undefined,
    checkedOnDate: coerceFineractDateTime(row.checkedOnDate),
    ip: typeof row.ip === 'string' ? row.ip : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    commandAsJson: typeof row.commandAsJson === 'string' ? row.commandAsJson : undefined
  };
}

function normalizeAuditTrailDetail(raw: unknown): FineractAuditTrailDetail | null {
  const summary = normalizeAuditTrailListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...summary,
    commandAsJson: typeof row.commandAsJson === 'string' ? row.commandAsJson : undefined,
    savingsAccountNo: typeof row.savingsAccountNo === 'string' ? row.savingsAccountNo : undefined,
    groupLevelName: typeof row.groupLevelName === 'string' ? row.groupLevelName : undefined,
    groupName: typeof row.groupName === 'string' ? row.groupName : undefined,
    url: typeof row.url === 'string' ? row.url : undefined
  };
}

function normalizeUserOption(raw: unknown): FineractAuditTrailUserOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const username = typeof row.username === 'string' ? row.username : '';
  if (!Number.isFinite(id) || !username) {
    return null;
  }
  return {
    id,
    username,
    firstname: typeof row.firstname === 'string' ? row.firstname : undefined,
    lastname: typeof row.lastname === 'string' ? row.lastname : undefined
  };
}

function normalizeSearchTemplate(raw: unknown): FineractAuditTrailSearchTemplate {
  if (!raw || typeof raw !== 'object') {
    return {
      appUsers: [],
      actionNames: [],
      entityNames: [],
      processingResults: []
    };
  }
  const row = raw as Record<string, unknown>;
  return {
    appUsers: Array.isArray(row.appUsers)
      ? row.appUsers
          .map((item) => normalizeUserOption(item))
          .filter((item): item is FineractAuditTrailUserOption => item !== null)
      : [],
    actionNames: Array.isArray(row.actionNames)
      ? row.actionNames.filter((item): item is string => typeof item === 'string')
      : [],
    entityNames: Array.isArray(row.entityNames)
      ? row.entityNames.filter((item): item is string => typeof item === 'string')
      : [],
    processingResults: Array.isArray(row.processingResults)
      ? row.processingResults
          .map((item) => {
            if (!item || typeof item !== 'object') {
              return null;
            }
            const option = item as Record<string, unknown>;
            const id = Number(option.id);
            const processingResult =
              typeof option.processingResult === 'string' ? option.processingResult : '';
            if (!Number.isFinite(id) || !processingResult) {
              return null;
            }
            return { id, processingResult };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [],
    dateFormat: typeof row.dateFormat === 'string' ? row.dateFormat : undefined,
    locale: typeof row.locale === 'string' ? row.locale : undefined
  };
}

export async function listAuditTrails(
  query: AuditTrailListQuery
): Promise<FineractAuditTrailsPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(AUDITS_PATH, buildAuditTrailSearchParams(query));
  if (!raw || typeof raw !== 'object') {
    return { totalFilteredRecords: 0, pageItems: [] };
  }
  const row = raw as Record<string, unknown>;
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeAuditTrailListItem(item))
        .filter((item): item is FineractAuditTrailListItem => item !== null)
    : [];
  return {
    totalFilteredRecords: Number.isFinite(Number(row.totalFilteredRecords))
      ? Number(row.totalFilteredRecords)
      : pageItems.length,
    pageItems
  };
}

export async function getAuditTrailSearchTemplate(): Promise<FineractAuditTrailSearchTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${AUDITS_PATH}/searchtemplate`);
  return normalizeSearchTemplate(raw);
}

export async function getAuditTrail(auditId: number): Promise<FineractAuditTrailDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${AUDITS_PATH}/${auditId}`);
  return normalizeAuditTrailDetail(raw);
}

/** Fineract audit entity for savings account commands (including transactions). */
export const SAVINGS_ACCOUNT_AUDIT_ENTITY = 'SAVINGSACCOUNT';

/** @deprecated Use {@link SAVINGS_ACCOUNT_AUDIT_ENTITY}. */
export const SAVINGS_ACCOUNT_TRANSACTION_AUDIT_ENTITY = SAVINGS_ACCOUNT_AUDIT_ENTITY;

export function filterAuditTrailsForSavingsTransaction(
  audits: FineractAuditTrailListItem[],
  transactionId: string | number
): FineractAuditTrailListItem[] {
  const txId = Number(transactionId);
  if (!Number.isFinite(txId)) {
    return [];
  }
  return audits.filter((audit) => audit.subresourceId === txId || audit.resourceId === txId);
}

export async function listAuditTrailsForSavingsTransaction(
  accountId: string | number,
  transactionId: string | number,
  options?: { limit?: number }
): Promise<FineractAuditTrailsPage> {
  const page = await listAuditTrails({
    offset: 0,
    limit: options?.limit ?? 200,
    orderBy: 'id',
    sortOrder: 'desc',
    entityName: SAVINGS_ACCOUNT_AUDIT_ENTITY,
    savingsAccountId: String(accountId),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  });
  const pageItems = filterAuditTrailsForSavingsTransaction(page.pageItems, transactionId);
  return {
    pageItems,
    totalFilteredRecords: pageItems.length
  };
}

export async function listAuditTrailsForClient(
  clientId: string | number,
  options?: { limit?: number; offset?: number }
): Promise<FineractAuditTrailsPage> {
  return listAuditTrails({
    offset: options?.offset ?? 0,
    limit: options?.limit ?? 100,
    orderBy: 'id',
    sortOrder: 'desc',
    clientId: String(clientId),
    includeJson: true,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  });
}
