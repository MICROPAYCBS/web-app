import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  LoanOriginatorDetail,
  LoanOriginatorListItem,
  LoanOriginatorMutationResponse,
  LoanOriginatorTemplate
} from '@mifos/api-client';
import type {
  CreateLoanOriginatorPayload,
  UpdateLoanOriginatorPayload
} from '@mifos/validation';
import { normalizeLoanOriginatorListItem } from '@/lib/fineract/loan-originator-display';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/loan-originators';

function normalizeList(value: unknown): LoanOriginatorListItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeLoanOriginatorListItem(item))
    .filter((item): item is LoanOriginatorListItem => item !== null)
    .sort((left, right) => left.id - right.id);
}

function normalizeCodeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const code = item as Record<string, unknown>;
      const id = Number(code.id);
      const name = typeof code.name === 'string' ? code.name : '';
      return Number.isFinite(id) && name ? { id, name } : null;
    })
    .filter((item): item is { id: number; name: string } => item !== null);
}

function normalizeTemplateResponse(raw: unknown): LoanOriginatorTemplate {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    statusOptions: Array.isArray(row.statusOptions)
      ? row.statusOptions.filter((item): item is string => typeof item === 'string')
      : [],
    originatorTypeOptions: normalizeCodeOptions(row.originatorTypeOptions),
    channelTypeOptions: normalizeCodeOptions(row.channelTypeOptions)
  };
}

export async function listLoanOriginators(): Promise<LoanOriginatorListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  return normalizeList(raw);
}

export async function getLoanOriginatorTemplate(): Promise<LoanOriginatorTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplateResponse(raw);
}

export async function getLoanOriginator(
  loanOriginatorId: string | number
): Promise<LoanOriginatorDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${loanOriginatorId}`);
  const detail = normalizeLoanOriginatorListItem(raw);
  if (!detail) {
    throw new Error('Loan originator not found.');
  }
  return detail;
}

export async function createLoanOriginator(
  input: CreateLoanOriginatorPayload
): Promise<LoanOriginatorMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<LoanOriginatorMutationResponse>(BASE_PATH, input);
}

export async function updateLoanOriginator(
  loanOriginatorId: string | number,
  input: UpdateLoanOriginatorPayload
): Promise<LoanOriginatorMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<LoanOriginatorMutationResponse>(`${BASE_PATH}/${loanOriginatorId}`, input);
}

export async function deleteLoanOriginator(
  loanOriginatorId: string | number
): Promise<LoanOriginatorMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<LoanOriginatorMutationResponse>(`${BASE_PATH}/${loanOriginatorId}`);
}
