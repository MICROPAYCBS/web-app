/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  CashierLegalTenderLineDetail,
  OrganizationCashierListItem,
  OrganizationCashierMutationResponse,
  OrganizationCashierSummary,
  OrganizationCashierTransaction,
  OrganizationCashierTxnType
} from '@mifos/api-client';
import type {
  AllocateCashierCashPayload,
  AssignCashierPayload,
  SettleCashierCashPayload,
  UpdateCashierPayload
} from '@mifos/validation';
import {
  buildAssignCashierPayload,
  buildCashierCashPayload,
  buildUpdateCashierPayload
} from '@/lib/fineract/build-cashier-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

function extractCashierRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const cashiers = (raw as Record<string, unknown>).cashiers;
    if (Array.isArray(cashiers)) {
      return cashiers;
    }
  }
  return [];
}

function normalizeCashier(raw: unknown): OrganizationCashierListItem | null {
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
    staffId: row.staffId != null ? Number(row.staffId) : undefined,
    staffName: typeof row.staffName === 'string' ? row.staffName : undefined,
    tellerId: row.tellerId != null ? Number(row.tellerId) : undefined,
    tellerName: typeof row.tellerName === 'string' ? row.tellerName : undefined,
    startDate: row.startDate as number[] | string | undefined,
    endDate: row.endDate as number[] | string | undefined,
    isFullDay: row.isFullDay === true || row.fullDay === true
  };
}

function coerceSummaryAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeLegalTenderLineDetail(raw: unknown): CashierLegalTenderLineDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const legalTenderId = Number(row.legalTenderId);
  const quantity = Number(row.quantity);
  const value = Number(row.value);
  const lineAmount = Number(row.lineAmount);
  const label = typeof row.label === 'string' ? row.label : '';
  const tenderType = row.tenderType === 'COIN' ? 'COIN' : row.tenderType === 'NOTE' ? 'NOTE' : null;
  if (
    !Number.isFinite(legalTenderId) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(value) ||
    !Number.isFinite(lineAmount) ||
    !label ||
    !tenderType
  ) {
    return null;
  }
  return {
    legalTenderId,
    quantity,
    value,
    lineAmount,
    label,
    tenderType
  };
}

function normalizeCashierTransaction(raw: unknown): OrganizationCashierTransaction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const legalTenderLines = Array.isArray(row.legalTenderLines)
    ? row.legalTenderLines
        .map((line) => normalizeLegalTenderLineDetail(line))
        .filter((line): line is CashierLegalTenderLineDetail => line !== null)
    : undefined;
  const currencyCode =
    typeof row.currencyCode === 'string'
      ? row.currencyCode
      : typeof (row.currency as Record<string, unknown> | undefined)?.code === 'string'
        ? ((row.currency as Record<string, unknown>).code as string)
        : undefined;

  return {
    id,
    cashierId: row.cashierId != null ? Number(row.cashierId) : undefined,
    currencyCode,
    txnDate: row.txnDate as number[] | string | undefined,
    txnAmount: coerceSummaryAmount(row.txnAmount),
    txnType: row.txnType as OrganizationCashierTxnType | undefined,
    entityId: row.entityId != null ? Number(row.entityId) : undefined,
    entityType: typeof row.entityType === 'string' ? row.entityType : undefined,
    txnNote: typeof row.txnNote === 'string' ? row.txnNote : undefined,
    currency: row.currency as OrganizationCashierTransaction['currency'],
    legalTenderLines: legalTenderLines && legalTenderLines.length > 0 ? legalTenderLines : undefined
  };
}

function extractCashierTransactionPageItems(raw: unknown): OrganizationCashierTransaction[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeCashierTransaction(item))
      .filter((item): item is OrganizationCashierTransaction => item !== null);
  }
  if (raw && typeof raw === 'object') {
    const pageItems = (raw as Record<string, unknown>).pageItems;
    if (Array.isArray(pageItems)) {
      return pageItems
        .map((item) => normalizeCashierTransaction(item))
        .filter((item): item is OrganizationCashierTransaction => item !== null);
    }
  }
  return [];
}

function normalizeSummary(raw: unknown): OrganizationCashierSummary {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const pageItems = extractCashierTransactionPageItems(row.cashierTransactions);
  return {
    netCash: coerceSummaryAmount(row.netCash),
    sumCashAllocation: coerceSummaryAmount(row.sumCashAllocation),
    sumCashSettlement: coerceSummaryAmount(row.sumCashSettlement),
    sumInwardCash: coerceSummaryAmount(row.sumInwardCash),
    sumOutwardCash: coerceSummaryAmount(row.sumOutwardCash),
    cashierName: typeof row.cashierName === 'string' ? row.cashierName : undefined,
    tellerName: typeof row.tellerName === 'string' ? row.tellerName : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    cashierTransactions: { pageItems }
  };
}

export async function listOrganizationCashiers(
  tellerId: string | number
): Promise<OrganizationCashierListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/tellers/${tellerId}/cashiers`);
  return extractCashierRows(raw)
    .map((item) => normalizeCashier(item))
    .filter((item): item is OrganizationCashierListItem => item !== null);
}

export async function getOrganizationCashierSummary(
  tellerId: string | number,
  cashierId: string | number,
  currencyCode: string
): Promise<OrganizationCashierSummary> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `/tellers/${tellerId}/cashiers/${cashierId}/summaryandtransactions`,
    { currencyCode }
  );
  return normalizeSummary(raw);
}

export async function createOrganizationCashier(
  tellerId: string | number,
  input: AssignCashierPayload
): Promise<OrganizationCashierMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationCashierMutationResponse>(
    `/tellers/${tellerId}/cashiers`,
    buildAssignCashierPayload(input)
  );
}

export async function updateOrganizationCashier(
  tellerId: string | number,
  cashierId: string | number,
  input: UpdateCashierPayload
): Promise<OrganizationCashierMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<OrganizationCashierMutationResponse>(
    `/tellers/${tellerId}/cashiers/${cashierId}`,
    buildUpdateCashierPayload(input)
  );
}

export async function deleteOrganizationCashier(
  tellerId: string | number,
  cashierId: string | number
): Promise<OrganizationCashierMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<OrganizationCashierMutationResponse>(
    `/tellers/${tellerId}/cashiers/${cashierId}`
  );
}

export async function allocateCashToCashier(
  tellerId: string | number,
  cashierId: string | number,
  input: AllocateCashierCashPayload
): Promise<OrganizationCashierMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationCashierMutationResponse>(
    `/tellers/${tellerId}/cashiers/${cashierId}/allocate`,
    buildCashierCashPayload(input)
  );
}

export async function settleCashFromCashier(
  tellerId: string | number,
  cashierId: string | number,
  input: SettleCashierCashPayload
): Promise<OrganizationCashierMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationCashierMutationResponse>(
    `/tellers/${tellerId}/cashiers/${cashierId}/settle`,
    buildCashierCashPayload(input)
  );
}
