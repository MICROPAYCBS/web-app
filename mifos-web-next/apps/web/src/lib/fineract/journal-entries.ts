import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractJournalEntriesPage,
  FineractJournalEntryGlAccountOption,
  FineractJournalEntryListItem,
  FineractJournalEntryMutationResponse,
  FineractJournalEntryRevertResponse,
  FineractJournalEntryUpdateNarrationResponse
} from '@mifos/api-client';
import {
  buildCreateJournalEntryPayload,
  buildUpdateJournalEntryNarrationPayload,
  type CreateJournalEntryFormInput,
  type RevertJournalEntryInput,
  type UpdateJournalEntryNarrationInput
} from '@mifos/validation';
import { backfillJournalEntryGlAccountCode } from '@/lib/accounting/journal-entry-display';
import {
  buildJournalEntrySearchParams,
  type JournalEntryListQuery
} from '@/lib/fineract/journal-entry-query';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

const JOURNAL_ENTRIES_PATH = '/journalentries';

function normalizeEnumOption(raw: unknown): FineractEnumOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : '';
  if (!Number.isFinite(id) || !value) {
    return null;
  }
  return { id, value };
}

function normalizeJournalEntryListItem(raw: unknown): FineractJournalEntryListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const officeName = typeof row.officeName === 'string' ? row.officeName : '';
  const transactionId = typeof row.transactionId === 'string' ? row.transactionId : '';
  const rawGlAccountCode = typeof row.glAccountCode === 'string' ? row.glAccountCode : '';
  const glAccountName = typeof row.glAccountName === 'string' ? row.glAccountName : '';
  const glAccountType = normalizeEnumOption(row.glAccountType);
  const entryType = normalizeEnumOption(row.entryType);
  const amount = Number(row.amount);
  if (
    !Number.isFinite(id) ||
    !officeName ||
    !transactionId ||
    !rawGlAccountCode ||
    !glAccountName ||
    !glAccountType ||
    !entryType ||
    !Number.isFinite(amount)
  ) {
    return null;
  }

  const currencyRaw = row.currency;
  const currency =
    currencyRaw && typeof currencyRaw === 'object'
      ? {
          code:
            typeof (currencyRaw as Record<string, unknown>).code === 'string'
              ? ((currencyRaw as Record<string, unknown>).code as string)
              : '',
          displaySymbol:
            typeof (currencyRaw as Record<string, unknown>).displaySymbol === 'string'
              ? ((currencyRaw as Record<string, unknown>).displaySymbol as string)
              : undefined,
          name:
            typeof (currencyRaw as Record<string, unknown>).name === 'string'
              ? ((currencyRaw as Record<string, unknown>).name as string)
              : undefined
        }
      : { code: '' };

  if (!currency.code) {
    return null;
  }

  const officeIdRaw = row.officeId;
  const officeId =
    officeIdRaw == null || officeIdRaw === ''
      ? undefined
      : Number(officeIdRaw);
  const departmentIdRaw = row.departmentId;
  const departmentId =
    departmentIdRaw == null || departmentIdRaw === ''
      ? undefined
      : Number(departmentIdRaw);

  const resolvedOfficeId =
    officeId != null && Number.isFinite(officeId) ? officeId : undefined;
  const resolvedDepartmentId =
    departmentId != null && Number.isFinite(departmentId) ? departmentId : undefined;

  return {
    id,
    officeName,
    officeId: resolvedOfficeId,
    transactionId,
    transactionDate:
      typeof row.transactionDate === 'string' || Array.isArray(row.transactionDate)
        ? (row.transactionDate as string | number[])
        : '',
    glAccountType,
    createdByUserName:
      typeof row.createdByUserName === 'string' ? row.createdByUserName : undefined,
    submittedOnDate:
      typeof row.submittedOnDate === 'string' || Array.isArray(row.submittedOnDate)
        ? (row.submittedOnDate as string | number[])
        : undefined,
    glAccountCode: backfillJournalEntryGlAccountCode({
      glAccountCode: rawGlAccountCode,
      officeId: resolvedOfficeId,
      departmentId: resolvedDepartmentId
    }),
    glAccountName,
    currency,
    entryType,
    amount,
    manualEntry: row.manualEntry === true,
    reversed: row.reversed === true,
    referenceNumber: typeof row.referenceNumber === 'string' ? row.referenceNumber : undefined,
    comments: typeof row.comments === 'string' ? row.comments : undefined,
    paymentTypeName: typeof row.paymentTypeName === 'string' ? row.paymentTypeName : undefined,
    externalAssetOwner:
      typeof row.externalAssetOwner === 'string' ? row.externalAssetOwner : undefined,
    departmentId: resolvedDepartmentId,
    departmentName: typeof row.departmentName === 'string' ? row.departmentName : undefined
  };
}

function normalizeGlAccountOption(raw: unknown): FineractJournalEntryGlAccountOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  if (!Number.isFinite(id) || !name || !glCode) {
    return null;
  }
  const typeRaw = row.type;
  const typeId =
    typeRaw && typeof typeRaw === 'object' && 'id' in (typeRaw as Record<string, unknown>)
      ? Number((typeRaw as Record<string, unknown>).id)
      : undefined;
  return {
    id,
    name,
    glCode,
    typeId: Number.isFinite(typeId) ? typeId : undefined
  };
}

export async function listJournalEntryGlAccounts(): Promise<FineractJournalEntryGlAccountOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/glaccounts', {
    manualEntriesAllowed: 'true',
    usage: '1',
    disabled: 'false'
  });
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeGlAccountOption(item))
    .filter((item): item is FineractJournalEntryGlAccountOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listJournalEntries(query: JournalEntryListQuery): Promise<FineractJournalEntriesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(JOURNAL_ENTRIES_PATH, buildJournalEntrySearchParams(query));
  if (!raw || typeof raw !== 'object') {
    return { pageItems: [], totalFilteredRecords: 0 };
  }
  const row = raw as Record<string, unknown>;
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeJournalEntryListItem(item))
        .filter((item): item is FineractJournalEntryListItem => item !== null)
    : [];
  return {
    pageItems,
    totalFilteredRecords: Number(row.totalFilteredRecords) || pageItems.length
  };
}

export async function getJournalEntryTransaction(
  transactionId: string
): Promise<FineractJournalEntriesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(JOURNAL_ENTRIES_PATH, {
    transactionId,
    transactionDetails: 'true',
    // Bound the association query — a transaction is a small set of lines.
    limit: '200',
    offset: '0'
  });
  if (!raw || typeof raw !== 'object') {
    return { pageItems: [], totalFilteredRecords: 0 };
  }
  const row = raw as Record<string, unknown>;
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeJournalEntryListItem(item))
        .filter((item): item is FineractJournalEntryListItem => item !== null)
    : [];
  return {
    pageItems,
    totalFilteredRecords: pageItems.length
  };
}

export async function createJournalEntry(
  input: CreateJournalEntryFormInput
): Promise<FineractJournalEntryMutationResponse> {
  const fineract = await createFineractClient();
  const payload = buildCreateJournalEntryPayload(input, {
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
  const body = { ...payload };
  if (!body.externalAssetOwner) {
    delete body.externalAssetOwner;
  }
  const raw = await fineract.post<FineractJournalEntryMutationResponse>(JOURNAL_ENTRIES_PATH, body);
  return {
    transactionId: String(raw?.transactionId ?? ''),
    officeId: raw?.officeId,
    resourceId: raw?.resourceId
  };
}

export async function revertJournalEntryTransaction(
  transactionId: string,
  input: RevertJournalEntryInput
): Promise<FineractJournalEntryRevertResponse> {
  const fineract = await createFineractClient();
  const body = input.comments?.trim() ? { comments: input.comments.trim() } : {};
  const raw = await fineract.post<FineractJournalEntryRevertResponse>(
    `${JOURNAL_ENTRIES_PATH}/${transactionId}`,
    body,
    { command: 'reverse' }
  );
  return {
    transactionId: String(raw?.transactionId ?? transactionId),
    resourceId: raw?.resourceId
  };
}

export async function updateJournalEntryNarration(
  transactionId: string,
  input: UpdateJournalEntryNarrationInput
): Promise<FineractJournalEntryUpdateNarrationResponse> {
  const fineract = await createFineractClient();
  const body = buildUpdateJournalEntryNarrationPayload(input);
  const raw = await fineract.post<FineractJournalEntryUpdateNarrationResponse>(
    `${JOURNAL_ENTRIES_PATH}/${transactionId}`,
    body,
    { command: 'updateNarration' }
  );
  return {
    transactionId: String(raw?.transactionId ?? transactionId),
    resourceId: raw?.resourceId
  };
}
