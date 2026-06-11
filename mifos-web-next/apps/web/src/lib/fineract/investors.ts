import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  InvestorTransferItem,
  InvestorTransferSearchPage
} from '@mifos/api-client';
import type {
  CancelInvestorTransferInput,
  InvestorSearchPayload
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

export const INVESTORS_PATH = '/organization/investors';

const BASE_PATH = '/external-asset-owners';

function omitEmpty(entries: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value?.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

function normalizeDetails(raw: unknown): InvestorTransferItem['details'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const numberField = (key: string) =>
    Number.isFinite(Number(row[key])) ? Number(row[key]) : undefined;

  return {
    totalPrincipalOutstanding: numberField('totalPrincipalOutstanding'),
    totalInterestOutstanding: numberField('totalInterestOutstanding'),
    totalFeeChargesOutstanding: numberField('totalFeeChargesOutstanding'),
    totalPenaltyChargesOutstanding: numberField('totalPenaltyChargesOutstanding'),
    totalOutstanding: numberField('totalOutstanding'),
    totalOverpaid: numberField('totalOverpaid')
  };
}

function normalizeTransferItem(raw: unknown): InvestorTransferItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const ownerRaw = row.owner;
  let owner: InvestorTransferItem['owner'];
  if (ownerRaw && typeof ownerRaw === 'object') {
    const ownerRecord = ownerRaw as Record<string, unknown>;
    owner = {
      externalId:
        typeof ownerRecord.externalId === 'string' ? ownerRecord.externalId : undefined
    };
  } else {
    owner = undefined;
  }

  const transferId = Number(row.transferId);
  return {
    transferId: Number.isFinite(transferId) ? transferId : undefined,
    transferExternalId:
      typeof row.transferExternalId === 'string' ? row.transferExternalId : undefined,
    status: typeof row.status === 'string' ? row.status : undefined,
    effectiveFrom: row.effectiveFrom as string | number[] | undefined,
    effectiveTo: row.effectiveTo as string | number[] | undefined,
    settlementDate: row.settlementDate as string | number[] | undefined,
    owner,
    loanAccount: typeof row.loanAccount === 'string' ? row.loanAccount : undefined,
    purchasePriceRatio: Number.isFinite(Number(row.purchasePriceRatio))
      ? Number(row.purchasePriceRatio)
      : undefined,
    totalAmount: Number.isFinite(Number(row.totalAmount)) ? Number(row.totalAmount) : undefined,
    details: normalizeDetails(row.details)
  };
}

export function buildInvestorSearchBody(input: InvestorSearchPayload): Record<string, unknown> {
  const request = omitEmpty({
    text: input.request.text,
    effectiveFromDate: input.request.effectiveFromDate,
    effectiveToDate: input.request.effectiveToDate,
    settlementFromDate: input.request.settlementFromDate,
    settlementToDate: input.request.settlementToDate
  });

  return {
    request,
    page: input.page,
    size: input.size
  };
}

export async function searchInvestorTransfers(
  input: InvestorSearchPayload
): Promise<InvestorTransferSearchPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<Record<string, unknown>>(
    `${BASE_PATH}/search`,
    buildInvestorSearchBody(input)
  );

  const content = Array.isArray(raw.content)
    ? raw.content
        .map((item) => normalizeTransferItem(item))
        .filter((item): item is InvestorTransferItem => item !== null)
    : [];

  return {
    content,
    totalElements: Number.isFinite(Number(raw.totalElements)) ? Number(raw.totalElements) : 0,
    totalPages: Number.isFinite(Number(raw.totalPages)) ? Number(raw.totalPages) : undefined,
    size: Number.isFinite(Number(raw.size)) ? Number(raw.size) : input.size,
    number: Number.isFinite(Number(raw.number)) ? Number(raw.number) : input.page
  };
}

export async function cancelInvestorTransfer(input: CancelInvestorTransferInput): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${BASE_PATH}/transfers/${input.transferId}`, {
    transferExternalId: input.transferExternalId
  }, { command: 'cancel' });
}
