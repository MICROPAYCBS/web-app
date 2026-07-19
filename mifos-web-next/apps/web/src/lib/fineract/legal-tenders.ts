import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CurrencyLegalTender,
  CurrencyLegalTenderMutationResponse,
  LegalTenderType
} from '@mifos/api-client';
import type { UpsertLegalTenderPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeLegalTenderType(value: unknown): LegalTenderType | null {
  if (value === 'NOTE' || value === 'COIN') {
    return value;
  }
  return null;
}

export function normalizeCurrencyLegalTender(raw: unknown): CurrencyLegalTender | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const currencyCode = typeof row.currencyCode === 'string' ? row.currencyCode.trim() : '';
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  const tenderType = normalizeLegalTenderType(row.tenderType);
  const value = Number(row.value);
  const displayOrder = Number(row.displayOrder);
  if (
    !Number.isFinite(id) ||
    !currencyCode ||
    !label ||
    !tenderType ||
    !Number.isFinite(value) ||
    !Number.isFinite(displayOrder)
  ) {
    return null;
  }
  return {
    id,
    currencyCode,
    value,
    tenderType,
    label,
    displayOrder,
    active: row.active !== false
  };
}

function normalizeLegalTenderList(raw: unknown): CurrencyLegalTender[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeCurrencyLegalTender(item))
    .filter((item): item is CurrencyLegalTender => item !== null)
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }
      return right.value - left.value;
    });
}

export async function listCurrencyLegalTenders(
  currencyCode: string,
  options?: { includeInactive?: boolean }
): Promise<CurrencyLegalTender[]> {
  const fineract = await createFineractClient();
  const query: Record<string, string> = {};
  if (options?.includeInactive) {
    query.includeInactive = 'true';
  }
  const raw = await fineract.get<unknown>(
    `/currencies/${encodeURIComponent(currencyCode)}/legal-tenders`,
    query
  );
  return normalizeLegalTenderList(raw);
}

export async function getCurrencyLegalTender(
  currencyCode: string,
  legalTenderId: string | number
): Promise<CurrencyLegalTender> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `/currencies/${encodeURIComponent(currencyCode)}/legal-tenders/${legalTenderId}`
  );
  const tender = normalizeCurrencyLegalTender(raw);
  if (!tender) {
    throw new Error('Legal tender not found.');
  }
  return tender;
}

export async function createCurrencyLegalTender(
  currencyCode: string,
  input: UpsertLegalTenderPayload
): Promise<CurrencyLegalTenderMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<CurrencyLegalTenderMutationResponse>(
    `/currencies/${encodeURIComponent(currencyCode)}/legal-tenders`,
    input
  );
}

export async function updateCurrencyLegalTender(
  currencyCode: string,
  legalTenderId: string | number,
  input: UpsertLegalTenderPayload
): Promise<CurrencyLegalTenderMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<CurrencyLegalTenderMutationResponse>(
    `/currencies/${encodeURIComponent(currencyCode)}/legal-tenders/${legalTenderId}`,
    input
  );
}

export async function deleteCurrencyLegalTender(
  currencyCode: string,
  legalTenderId: string | number
): Promise<CurrencyLegalTenderMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<CurrencyLegalTenderMutationResponse>(
    `/currencies/${encodeURIComponent(currencyCode)}/legal-tenders/${legalTenderId}`
  );
}

export async function listActiveCurrencyLegalTenders(
  currencyCode: string
): Promise<CurrencyLegalTender[]> {
  const rows = await listCurrencyLegalTenders(currencyCode);
  return rows.filter((row) => row.active);
}
