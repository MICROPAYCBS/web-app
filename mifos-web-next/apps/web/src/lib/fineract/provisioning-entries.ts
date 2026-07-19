import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractProvisioningCategory,
  FineractProvisioningEntryDetail,
  FineractProvisioningEntryLineItem,
  FineractProvisioningEntryLinesPage,
  FineractProvisioningEntryListItem,
  FineractProvisioningEntryMutationResponse,
  FineractProvisioningEntriesPage,
  FineractProvisioningJournalEntriesPage,
  FineractProvisioningJournalEntry
} from '@mifos/api-client';
import {
  buildCreateProvisioningEntryPayload,
  type CreateProvisioningEntryInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const PROVISIONING_ENTRIES_PATH = '/provisioningentries';

function normalizeListItem(raw: unknown): FineractProvisioningEntryListItem | null {
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
    createdUser: typeof row.createdUser === 'string' ? row.createdUser : '',
    createdDate: typeof row.createdDate === 'string' ? row.createdDate : '',
    journalEntry: Boolean(row.journalEntry)
  };
}

function normalizePageItems<T>(
  raw: unknown,
  normalizeItem: (item: unknown) => T | null
): { pageItems: T[]; totalFilteredRecords: number } {
  if (!raw || typeof raw !== 'object') {
    return { pageItems: [], totalFilteredRecords: 0 };
  }
  const row = raw as Record<string, unknown>;
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeItem(item))
        .filter((item): item is T => item !== null)
    : Array.isArray(raw)
      ? raw
          .map((item) => normalizeItem(item))
          .filter((item): item is T => item !== null)
      : [];
  const totalFilteredRecords =
    typeof row.totalFilteredRecords === 'number' ? row.totalFilteredRecords : pageItems.length;
  return { pageItems, totalFilteredRecords };
}

function normalizeDetail(raw: unknown): FineractProvisioningEntryDetail | null {
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
    createdUser: typeof row.createdUser === 'string' ? row.createdUser : '',
    createdDate: typeof row.createdDate === 'string' ? row.createdDate : '',
    reservedAmount:
      typeof row.reservedAmount === 'number' || typeof row.reservedAmount === 'string'
        ? row.reservedAmount
        : '',
    journalEntry: Boolean(row.journalEntry)
  };
}

function normalizeLineItem(raw: unknown): FineractProvisioningEntryLineItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    officeName: typeof row.officeName === 'string' ? row.officeName : '',
    productName: typeof row.productName === 'string' ? row.productName : '',
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : '',
    categoryName: typeof row.categoryName === 'string' ? row.categoryName : '',
    amountreserved:
      typeof row.amountreserved === 'number' || typeof row.amountreserved === 'string'
        ? row.amountreserved
        : '',
    liabilityAccountName:
      typeof row.liabilityAccountName === 'string' ? row.liabilityAccountName : '',
    expenseAccountName: typeof row.expenseAccountName === 'string' ? row.expenseAccountName : ''
  };
}

function normalizeJournalEntry(raw: unknown): FineractProvisioningJournalEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const glAccountType =
    row.glAccountType && typeof row.glAccountType === 'object'
      ? (row.glAccountType as { value?: string })
      : {};
  const entryType =
    row.entryType && typeof row.entryType === 'object'
      ? (row.entryType as { value?: string })
      : {};
  const currency =
    row.currency && typeof row.currency === 'object'
      ? (row.currency as { code?: string; displaySymbol?: string })
      : {};
  return {
    id,
    officeName: typeof row.officeName === 'string' ? row.officeName : '',
    transactionDate:
      typeof row.transactionDate === 'string' || Array.isArray(row.transactionDate)
        ? (row.transactionDate as string | number[])
        : '',
    transactionId: typeof row.transactionId === 'string' ? row.transactionId : '',
    glAccountType: { value: glAccountType.value ?? '' },
    createdByUserName: typeof row.createdByUserName === 'string' ? row.createdByUserName : '',
    glAccountCode: typeof row.glAccountCode === 'string' ? row.glAccountCode : '',
    glAccountName: typeof row.glAccountName === 'string' ? row.glAccountName : '',
    entryType: { value: entryType.value ?? '' },
    amount: typeof row.amount === 'number' ? row.amount : 0,
    currency: {
      code: currency.code ?? '',
      displaySymbol: currency.displaySymbol
    }
  };
}

function normalizeCategory(raw: unknown): FineractProvisioningCategory | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const categoryName = typeof row.categoryName === 'string' ? row.categoryName : '';
  if (!Number.isFinite(id) || !categoryName) {
    return null;
  }
  return { id, categoryName };
}

export async function listProvisioningEntries(): Promise<FineractProvisioningEntriesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(PROVISIONING_ENTRIES_PATH);
  const { pageItems, totalFilteredRecords } = normalizePageItems(raw, normalizeListItem);
  return { pageItems, totalFilteredRecords };
}

export async function getProvisioningEntry(
  entryId: number
): Promise<FineractProvisioningEntryDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${PROVISIONING_ENTRIES_PATH}/${entryId}`);
  return normalizeDetail(raw);
}

export async function getProvisioningEntryLines(
  entryId: number
): Promise<FineractProvisioningEntryLinesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${PROVISIONING_ENTRIES_PATH}/entries`, {
    entryId: String(entryId)
  });
  const { pageItems, totalFilteredRecords } = normalizePageItems(raw, normalizeLineItem);
  return { pageItems, totalFilteredRecords };
}

export async function listProvisioningCategories(): Promise<FineractProvisioningCategory[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/provisioningcategory');
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeCategory(item))
    .filter((item): item is FineractProvisioningCategory => item !== null)
    .sort((left, right) =>
      left.categoryName.localeCompare(right.categoryName, undefined, { sensitivity: 'base' })
    );
}

export async function getProvisioningJournalEntries(
  entryId: number
): Promise<FineractProvisioningJournalEntriesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/journalentries/provisioning', {
    entryId: String(entryId)
  });
  const { pageItems, totalFilteredRecords } = normalizePageItems(raw, normalizeJournalEntry);
  return { pageItems, totalFilteredRecords };
}

export async function createProvisioningEntry(
  input: CreateProvisioningEntryInput
): Promise<FineractProvisioningEntryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractProvisioningEntryMutationResponse>(
    PROVISIONING_ENTRIES_PATH,
    buildCreateProvisioningEntryPayload(input)
  );
}

export async function recreateProvisioningEntry(
  entryId: number
): Promise<FineractProvisioningEntryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractProvisioningEntryMutationResponse>(
    `${PROVISIONING_ENTRIES_PATH}/${entryId}`,
    {},
    { command: 'recreateprovisioningentry' }
  );
}

export async function createProvisioningJournalEntries(
  entryId: number
): Promise<FineractProvisioningEntryMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractProvisioningEntryMutationResponse>(
    `${PROVISIONING_ENTRIES_PATH}/${entryId}`,
    {},
    { command: 'createjournalentry' }
  );
}
