import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateShareAccountResponse,
  FineractCurrencyOption,
  FineractEnumOption,
  FineractShareAccountCharge,
  FineractShareAccountChargeOption,
  FineractShareAccountDetail,
  FineractShareAccountDividend,
  FineractShareAccountProductOption,
  FineractShareAccountSavingsOption,
  FineractShareAccountStatus,
  FineractShareAccountSummary,
  FineractShareAccountTemplate,
  FineractShareAccountTimeline,
  FineractShareAccountTransaction
} from '@mifos/api-client';
import type { CreateShareAccountInput, UpdateShareAccountInput } from '@mifos/validation';
import { SHARE_ACCOUNTS_API_PATH } from '@/lib/fineract/share-account-config';
import {
  buildShareAccountCreatePayload,
  buildShareAccountUpdatePayload
} from '@/lib/fineract/share-account-payload';
import { createFineractClient } from '@/lib/fineract/create-client';
import { asCurrency, asEnumOption } from '@/lib/fineract/product-normalize';

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeStatus(raw: unknown): FineractShareAccountStatus | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const value = asString(row.value);
  if (id == null && !value) {
    return undefined;
  }
  return {
    id,
    code: asString(row.code),
    value,
    submittedAndPendingApproval: row.submittedAndPendingApproval === true,
    approved: row.approved === true,
    rejected: row.rejected === true,
    active: row.active === true,
    closed: row.closed === true
  };
}

function normalizeCurrency(raw: unknown): FineractCurrencyOption | undefined {
  return asCurrency(raw);
}

function normalizeEnum(raw: unknown): FineractEnumOption | undefined {
  return asEnumOption(raw);
}

function normalizeTimeline(raw: unknown): FineractShareAccountTimeline | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    submittedOnDate: row.submittedOnDate as FineractShareAccountTimeline['submittedOnDate'],
    submittedByUsername: asString(row.submittedByUsername),
    submittedByFirstname: asString(row.submittedByFirstname),
    submittedByLastname: asString(row.submittedByLastname),
    rejectedDate: row.rejectedDate as FineractShareAccountTimeline['rejectedDate'],
    rejectedByUsername: asString(row.rejectedByUsername),
    rejectedByFirstname: asString(row.rejectedByFirstname),
    rejectedByLastname: asString(row.rejectedByLastname),
    approvedDate: row.approvedDate as FineractShareAccountTimeline['approvedDate'],
    approvedByUsername: asString(row.approvedByUsername),
    approvedByFirstname: asString(row.approvedByFirstname),
    approvedByLastname: asString(row.approvedByLastname),
    activatedDate: row.activatedDate as FineractShareAccountTimeline['activatedDate'],
    activatedByUsername: asString(row.activatedByUsername),
    activatedByFirstname: asString(row.activatedByFirstname),
    activatedByLastname: asString(row.activatedByLastname),
    closedDate: row.closedDate as FineractShareAccountTimeline['closedDate'],
    closedByUsername: asString(row.closedByUsername),
    closedByFirstname: asString(row.closedByFirstname),
    closedByLastname: asString(row.closedByLastname)
  };
}

function normalizeSummary(raw: unknown): FineractShareAccountSummary | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    id: asNumber(row.id),
    accountNo: asString(row.accountNo),
    totalApprovedShares: asNumber(row.totalApprovedShares),
    totalPendingForApprovalShares: asNumber(row.totalPendingForApprovalShares),
    externalId: asString(row.externalId),
    productId: asNumber(row.productId),
    productName: asString(row.productName),
    shortProductName: asString(row.shortProductName),
    status: normalizeStatus(row.status),
    currency: normalizeCurrency(row.currency),
    timeline: normalizeTimeline(row.timeline)
  };
}

function normalizeTransaction(raw: unknown): FineractShareAccountTransaction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  if (id == null) {
    return null;
  }
  return {
    id,
    accountId: asNumber(row.accountId),
    purchasedDate: row.purchasedDate as FineractShareAccountTransaction['purchasedDate'],
    numberOfShares: asNumber(row.numberOfShares),
    purchasedPrice: asNumber(row.purchasedPrice),
    status: normalizeEnum(row.status),
    type: normalizeEnum(row.type),
    amount: asNumber(row.amount),
    chargeAmount: asNumber(row.chargeAmount),
    amountPaid: asNumber(row.amountPaid)
  };
}

function normalizeCharge(raw: unknown): FineractShareAccountCharge | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const name = asString(row.name);
  if (id == null || !name) {
    return null;
  }
  return {
    id,
    chargeId: asNumber(row.chargeId),
    accountId: asNumber(row.accountId),
    name,
    chargeTimeType: normalizeEnum(row.chargeTimeType),
    chargeCalculationType: normalizeEnum(row.chargeCalculationType),
    percentage: asNumber(row.percentage),
    amountPercentageAppliedTo: asNumber(row.amountPercentageAppliedTo),
    currency: normalizeCurrency(row.currency),
    amount: asNumber(row.amount),
    amountPaid: asNumber(row.amountPaid),
    amountWaived: asNumber(row.amountWaived),
    amountWrittenOff: asNumber(row.amountWrittenOff),
    amountOutstanding: asNumber(row.amountOutstanding),
    amountOrPercentage: asNumber(row.amountOrPercentage),
    isActive: row.isActive === true || row.isActive === undefined
  };
}

function normalizeDividend(raw: unknown): FineractShareAccountDividend | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  if (id == null) {
    return null;
  }
  return {
    id,
    postedDate: row.postedDate as FineractShareAccountDividend['postedDate'],
    amount: asNumber(row.amount),
    status: normalizeEnum(row.status),
    savingsTransactionId: asNumber(row.savingsTransactionId)
  };
}

function normalizeProductOption(raw: unknown): FineractShareAccountProductOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const name = asString(row.name);
  if (id == null || !name) {
    return null;
  }
  return {
    id,
    name,
    shortName: asString(row.shortName),
    totalShares: asNumber(row.totalShares)
  };
}

function normalizeSavingsOption(raw: unknown): FineractShareAccountSavingsOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  if (id == null) {
    return null;
  }
  return {
    id,
    accountNo: asString(row.accountNo),
    clientId: asNumber(row.clientId),
    clientName: asString(row.clientName),
    productId: asNumber(row.productId),
    productName: asString(row.productName),
    status: normalizeStatus(row.status),
    currency: normalizeCurrency(row.currency)
  };
}

function normalizeChargeOption(raw: unknown): FineractShareAccountChargeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id) ?? asNumber(row.chargeId);
  if (id == null) {
    return null;
  }
  return {
    id,
    name: asString(row.name),
    amount: asNumber(row.amount) ?? asNumber(row.amountOrPercentage),
    amountOrPercentage: asNumber(row.amountOrPercentage),
    penalty: row.penalty === true,
    currency: normalizeCurrency(row.currency),
    chargeTimeType: normalizeEnum(row.chargeTimeType),
    chargeCalculationType: normalizeEnum(row.chargeCalculationType)
  };
}

function mapList<T>(raw: unknown, map: (item: unknown) => T | null): T[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map(map).filter((item): item is T => item !== null);
}

export function normalizeShareAccountDetail(raw: unknown): FineractShareAccountDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const accountNo = asString(row.accountNo);
  const status = normalizeStatus(row.status);
  const currency = normalizeCurrency(row.currency);
  if (id == null || !accountNo || !status || !currency) {
    return null;
  }

  return {
    id,
    accountNo,
    externalId: asString(row.externalId),
    savingsAccountNumber: asString(row.savingsAccountNumber),
    clientId: asNumber(row.clientId),
    clientName: asString(row.clientName),
    defaultShares: asNumber(row.defaultShares),
    productId: asNumber(row.productId),
    productName: asString(row.productName),
    status,
    timeline: normalizeTimeline(row.timeline),
    currency,
    summary: normalizeSummary(row.summary),
    purchasedShares: mapList(row.purchasedShares, normalizeTransaction),
    savingsAccountId: asNumber(row.savingsAccountId),
    currentMarketPrice: asNumber(row.currentMarketPrice),
    lockinPeriod: asNumber(row.lockinPeriod),
    lockPeriodTypeEnum: normalizeEnum(row.lockPeriodTypeEnum),
    minimumActivePeriod: asNumber(row.minimumActivePeriod),
    minimumActivePeriodTypeEnum: normalizeEnum(row.minimumActivePeriodTypeEnum),
    allowDividendCalculationForInactiveClients:
      row.allowDividendCalculationForInactiveClients === true,
    charges: mapList(row.charges, normalizeCharge),
    dividends: mapList(row.dividends, normalizeDividend),
    productOptions: mapList(row.productOptions, normalizeProductOption),
    chargeOptions: mapList(row.chargeOptions, normalizeChargeOption),
    clientSavingsAccounts: mapList(row.clientSavingsAccounts, normalizeSavingsOption),
    lockinPeriodFrequencyTypeOptions: mapList(
      row.lockinPeriodFrequencyTypeOptions,
      (item) => normalizeEnum(item) ?? null
    ),
    minimumActivePeriodFrequencyTypeOptions: mapList(
      row.minimumActivePeriodFrequencyTypeOptions,
      (item) => normalizeEnum(item) ?? null
    )
  };
}

export function normalizeShareAccountTemplate(raw: unknown): FineractShareAccountTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  return {
    clientId: asNumber(row.clientId),
    clientName: asString(row.clientName),
    productId: asNumber(row.productId),
    productName: asString(row.productName),
    currency: normalizeCurrency(row.currency),
    currentMarketPrice: asNumber(row.currentMarketPrice),
    defaultShares: asNumber(row.defaultShares),
    productOptions: mapList(row.productOptions, normalizeProductOption),
    chargeOptions: mapList(row.chargeOptions, normalizeChargeOption),
    charges: mapList(row.charges, normalizeChargeOption),
    clientSavingsAccounts: mapList(row.clientSavingsAccounts, normalizeSavingsOption),
    lockinPeriodFrequencyTypeOptions: mapList(
      row.lockinPeriodFrequencyTypeOptions,
      (item) => normalizeEnum(item) ?? null
    ),
    minimumActivePeriodFrequencyTypeOptions: mapList(
      row.minimumActivePeriodFrequencyTypeOptions,
      (item) => normalizeEnum(item) ?? null
    ),
    lockinPeriod: asNumber(row.lockinPeriod),
    lockPeriodTypeEnum: normalizeEnum(row.lockPeriodTypeEnum),
    minimumActivePeriod: asNumber(row.minimumActivePeriod),
    minimumActivePeriodTypeEnum: normalizeEnum(row.minimumActivePeriodTypeEnum),
    allowDividendCalculationForInactiveClients:
      row.allowDividendCalculationForInactiveClients === true
  };
}

export async function getShareAccountTemplate(
  clientId: string | number,
  productId?: string | number
): Promise<FineractShareAccountTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = { clientId: String(clientId) };
  if (productId != null && String(productId).trim() !== '') {
    params.productId = String(productId);
  }
  const raw = await fineract.get<unknown>(`${SHARE_ACCOUNTS_API_PATH}/template`, params);
  return normalizeShareAccountTemplate(raw);
}

export async function getShareAccount(
  accountId: string | number,
  options?: { template?: boolean }
): Promise<FineractShareAccountDetail | null> {
  const fineract = await createFineractClient();
  const params =
    options?.template === true ? { template: 'true' } : { template: 'false' };
  const raw = await fineract.get<unknown>(`${SHARE_ACCOUNTS_API_PATH}/${accountId}`, params);
  return normalizeShareAccountDetail(raw);
}

export async function createShareAccountRecord(
  clientId: string | number,
  input: CreateShareAccountInput
): Promise<CreateShareAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildShareAccountCreatePayload(clientId, input);
  return fineract.post<CreateShareAccountResponse>(SHARE_ACCOUNTS_API_PATH, payload);
}

export async function updateShareAccountRecord(
  accountId: string | number,
  input: UpdateShareAccountInput
): Promise<CreateShareAccountResponse> {
  const fineract = await createFineractClient();
  const payload = buildShareAccountUpdatePayload(input);
  return fineract.put<CreateShareAccountResponse>(
    `${SHARE_ACCOUNTS_API_PATH}/${accountId}`,
    payload
  );
}
