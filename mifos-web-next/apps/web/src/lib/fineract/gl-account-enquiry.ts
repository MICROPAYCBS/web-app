import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractGlAccountDetail,
  FineractJournalEntriesPage,
  FineractJournalEntryGlAccountOption,
  FineractJournalEntryListItem
} from '@mifos/api-client';
import { subDays } from 'date-fns';
import { buildGlAccountEnquirySummary, type GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import {
  buildGlAccountEnquirySearchParams,
  glAccountEnquiryHasRequiredAccount,
  type GlAccountEnquiryListQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { FINERACT_DATE_FORMAT, parseFineractDateString, toFineractDate } from '@/lib/fineract/dates';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { createFineractClient } from '@/lib/fineract/create-client';

const JOURNAL_ENTRIES_PATH = '/journalentries';

function normalizeEnumOption(raw: unknown): { id: number; value: string } | null {
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
  const glAccountCode = typeof row.glAccountCode === 'string' ? row.glAccountCode : '';
  const glAccountName = typeof row.glAccountName === 'string' ? row.glAccountName : '';
  const glAccountType = normalizeEnumOption(row.glAccountType);
  const entryType = normalizeEnumOption(row.entryType);
  const amount = Number(row.amount);
  if (
    !Number.isFinite(id) ||
    !officeName ||
    !transactionId ||
    !glAccountCode ||
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

  const organizationRunningBalance =
    row.organizationRunningBalance != null ? Number(row.organizationRunningBalance) : undefined;
  const officeRunningBalance =
    row.officeRunningBalance != null ? Number(row.officeRunningBalance) : undefined;

  return {
    id,
    officeName,
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
    glAccountCode,
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
    departmentId: row.departmentId != null ? Number(row.departmentId) : undefined,
    departmentName: typeof row.departmentName === 'string' ? row.departmentName : undefined,
    organizationRunningBalance: Number.isFinite(organizationRunningBalance)
      ? organizationRunningBalance
      : undefined,
    officeRunningBalance: Number.isFinite(officeRunningBalance) ? officeRunningBalance : undefined,
    runningBalanceComputed: row.runningBalanceComputed === true
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

async function fetchJournalEntriesPage(
  params: Record<string, string>
): Promise<FineractJournalEntriesPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(JOURNAL_ENTRIES_PATH, params);
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

function balanceScopeForQuery(query: GlAccountEnquiryListQuery): 'office' | 'organization' {
  return query.officeId ? 'office' : 'organization';
}

function dayBeforeFineractDate(value: string): string | null {
  const parsed = parseFineractDateString(value);
  if (!parsed) {
    return null;
  }
  return toFineractDate(subDays(parsed, 1));
}

async function fetchOpeningBalanceBeforePeriod(
  query: GlAccountEnquiryListQuery,
  glAccountTypeId: number,
  balanceScope: 'office' | 'organization'
): Promise<number | null> {
  if (!query.fromDate) {
    return null;
  }

  const priorToDate = dayBeforeFineractDate(query.fromDate);
  if (!priorToDate) {
    return null;
  }

  const params = buildGlAccountEnquirySearchParams(
    {
      ...query,
      toDate: priorToDate
    },
    { runningBalance: true, summaryFetch: true }
  );
  delete params.fromDate;

  const page = await fetchJournalEntriesPage(params);
  const entries = page.pageItems.filter((entry) => entry.reversed !== true);
  if (entries.length === 0) {
    return 0;
  }

  const lastEntry = [...entries].sort((left, right) => {
    const leftDate = String(left.transactionDate);
    const rightDate = String(right.transactionDate);
    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }
    return right.id - left.id;
  })[0];

  const runningBalance =
    balanceScope === 'office'
      ? lastEntry.officeRunningBalance
      : lastEntry.organizationRunningBalance;

  return runningBalance != null && Number.isFinite(runningBalance) ? runningBalance : null;
}

export async function listGlAccountEnquiryOptions(): Promise<FineractJournalEntryGlAccountOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/glaccounts', {
    usage: '1',
    disabled: 'false'
  });
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeGlAccountOption(item))
    .filter((item): item is FineractJournalEntryGlAccountOption => item !== null)
    .sort((left, right) => left.glCode.localeCompare(right.glCode));
}

export async function listGlAccountEnquiryEntries(
  query: GlAccountEnquiryListQuery
): Promise<FineractJournalEntriesPage> {
  if (!glAccountEnquiryHasRequiredAccount(query)) {
    return { pageItems: [], totalFilteredRecords: 0 };
  }

  const params = buildGlAccountEnquirySearchParams(query, { runningBalance: true });
  return fetchJournalEntriesPage(params);
}

export type GlAccountEnquiryResult = {
  page: FineractJournalEntriesPage;
  summary: GlAccountEnquirySummary | null;
  glAccount: FineractGlAccountDetail | null;
};

export async function fetchGlAccountEnquiry(
  query: GlAccountEnquiryListQuery
): Promise<GlAccountEnquiryResult> {
  if (!glAccountEnquiryHasRequiredAccount(query)) {
    return {
      page: { pageItems: [], totalFilteredRecords: 0 },
      summary: null,
      glAccount: null
    };
  }

  const glAccountId = Number(query.glAccountId);
  const balanceScope = balanceScopeForQuery(query);

  const [page, summaryPage, glAccount] = await Promise.all([
    listGlAccountEnquiryEntries(query),
    fetchJournalEntriesPage(
      buildGlAccountEnquirySearchParams(query, { runningBalance: true, summaryFetch: true })
    ),
    getGlAccount(glAccountId).catch(() => null)
  ]);

  const glAccountTypeId = glAccount?.type?.id;
  if (glAccountTypeId == null) {
    return { page, summary: null, glAccount };
  }

  const openingBalanceBeforePeriod = await fetchOpeningBalanceBeforePeriod(
    query,
    glAccountTypeId,
    balanceScope
  );

  const summary = buildGlAccountEnquirySummary({
    entries: summaryPage.pageItems,
    glAccountTypeId,
    balanceScope,
    openingBalanceBeforePeriod,
    totalFilteredRecords: summaryPage.totalFilteredRecords
  });

  return { page, summary, glAccount };
}
