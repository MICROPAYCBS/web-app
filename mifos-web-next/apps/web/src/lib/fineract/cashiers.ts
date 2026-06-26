/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  OrganizationCashierListItem,
  OrganizationCashierMutationResponse,
  OrganizationCashierSummary,
  OrganizationCashierTransaction
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
    isFullDay: row.isFullDay === true
  };
}

function normalizeSummary(raw: unknown): OrganizationCashierSummary {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const transactions = row.cashierTransactions;
  return {
    netCash: typeof row.netCash === 'number' ? row.netCash : undefined,
    sumCashAllocation:
      typeof row.sumCashAllocation === 'number' ? row.sumCashAllocation : undefined,
    sumCashSettlement:
      typeof row.sumCashSettlement === 'number' ? row.sumCashSettlement : undefined,
    sumInwardCash: typeof row.sumInwardCash === 'number' ? row.sumInwardCash : undefined,
    sumOutwardCash: typeof row.sumOutwardCash === 'number' ? row.sumOutwardCash : undefined,
    cashierName: typeof row.cashierName === 'string' ? row.cashierName : undefined,
    tellerName: typeof row.tellerName === 'string' ? row.tellerName : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    cashierTransactions:
      transactions && typeof transactions === 'object'
        ? {
            pageItems: Array.isArray((transactions as Record<string, unknown>).pageItems)
              ? ((transactions as Record<string, unknown>).pageItems as OrganizationCashierTransaction[])
              : undefined
          }
        : undefined
  };
}

export async function listOrganizationCashiers(
  tellerId: string | number
): Promise<OrganizationCashierListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/tellers/${tellerId}/cashiers`);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
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
