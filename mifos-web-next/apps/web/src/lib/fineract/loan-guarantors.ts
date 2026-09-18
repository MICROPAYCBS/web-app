/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type { LoanGuarantorItemInput } from '@mifos/validation';
import type {
  LoanGuarantorRecord,
  LoanGuarantorTypeOption
} from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildLoanGuarantorPayload } from '@/lib/fineract/client-loan-account-payload';

export type { LoanGuarantorRecord, LoanGuarantorTypeOption };

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function enumLabel(raw: unknown): { id?: number; value?: string } {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  return {
    id: toNumber(row.id),
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

function normalizeGuarantor(raw: unknown): LoanGuarantorRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const type = enumLabel(row.guarantorType);
  const firstname = typeof row.firstname === 'string' ? row.firstname : undefined;
  const lastname = typeof row.lastname === 'string' ? row.lastname : undefined;
  const displayName =
    typeof row.fullname === 'string'
      ? row.fullname
      : [firstname, lastname].filter(Boolean).join(' ').trim() || undefined;
  const status =
    row.status && typeof row.status === 'object'
      ? typeof (row.status as Record<string, unknown>).value === 'string'
        ? ((row.status as Record<string, unknown>).value as string)
        : undefined
      : typeof row.status === 'string'
        ? row.status
        : undefined;
  return {
    id,
    guarantorTypeId: type.id,
    guarantorTypeName: type.value,
    entityId: toNumber(row.entityId),
    firstname,
    lastname,
    displayName,
    status
  };
}

function normalizeTypeOption(raw: unknown): LoanGuarantorTypeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : undefined;
  if (!Number.isFinite(id) || !value) {
    return null;
  }
  return { id, value };
}

export async function getLoanGuarantors(
  accountId: string | number
): Promise<LoanGuarantorRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/guarantors`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeGuarantor(item))
    .filter((item): item is LoanGuarantorRecord => item != null);
}

export async function getLoanGuarantorTemplate(
  accountId: string | number
): Promise<{ guarantorTypeOptions: LoanGuarantorTypeOption[] }> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/guarantors/template`);
  if (!data || typeof data !== 'object') {
    return { guarantorTypeOptions: [] };
  }
  const row = data as Record<string, unknown>;
  const options = Array.isArray(row.guarantorTypeOptions)
    ? row.guarantorTypeOptions
        .map((item) => normalizeTypeOption(item))
        .filter((item): item is LoanGuarantorTypeOption => item != null)
    : [];
  return { guarantorTypeOptions: options };
}

export async function createLoanGuarantor(
  accountId: string | number,
  input: LoanGuarantorItemInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors`,
    buildLoanGuarantorPayload(input)
  );
}

export async function updateLoanGuarantor(
  accountId: string | number,
  guarantorId: number,
  input: LoanGuarantorItemInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors/${guarantorId}`,
    buildLoanGuarantorPayload(input)
  );
}

export async function deleteLoanGuarantor(
  accountId: string | number,
  guarantorId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors/${guarantorId}`
  );
}
