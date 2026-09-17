import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCommandProcessingResult,
  FineractLoanRescheduleReasonOption,
  FineractLoanRescheduleRequest,
  FineractLoanRescheduleRequestStatus,
  FineractLoanRescheduleTemplate
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

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

function normalizeReasonOption(raw: unknown): FineractLoanRescheduleReasonOption | null {
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
    name: typeof row.name === 'string' ? row.name : undefined,
    position: toNumber(row.position),
    description: typeof row.description === 'string' ? row.description : undefined,
    active: row.active === true,
    mandatory: row.mandatory === true
  };
}

function normalizeStatus(raw: unknown): FineractLoanRescheduleRequestStatus | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    id: toNumber(row.id),
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined,
    pendingApproval: row.pendingApproval === true,
    approved: row.approved === true,
    rejected: row.rejected === true
  };
}

export function normalizeLoanRescheduleRequest(raw: unknown): FineractLoanRescheduleRequest | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const reasonRaw = row.rescheduleReasonCodeValue;
  const reason =
    reasonRaw && typeof reasonRaw === 'object'
      ? {
          id: toNumber((reasonRaw as Record<string, unknown>).id),
          name:
            typeof (reasonRaw as Record<string, unknown>).name === 'string'
              ? ((reasonRaw as Record<string, unknown>).name as string)
              : undefined
        }
      : undefined;

  return {
    id,
    loanId: toNumber(row.loanId),
    clientId: toNumber(row.clientId),
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    loanAccountNumber:
      typeof row.loanAccountNumber === 'string' ? row.loanAccountNumber : undefined,
    statusEnum: normalizeStatus(row.statusEnum),
    rescheduleFromInstallment: toNumber(row.rescheduleFromInstallment),
    rescheduleFromDate: fineractApiDateToFormString(
      row.rescheduleFromDate as number[] | string | undefined
    ),
    recalculateInterest: row.recalculateInterest === true,
    rescheduleReasonCodeValue: reason,
    rescheduleReasonComment:
      typeof row.rescheduleReasonComment === 'string' ? row.rescheduleReasonComment : undefined
  };
}

function normalizeRequestList(raw: unknown): FineractLoanRescheduleRequest[] {
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown }).pageItems)
      ? ((raw as { pageItems: unknown[] }).pageItems)
      : [];
  return items
    .map((item) => normalizeLoanRescheduleRequest(item))
    .filter((item): item is FineractLoanRescheduleRequest => item != null);
}

export async function getLoanRescheduleTemplate(): Promise<FineractLoanRescheduleTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/rescheduleloans/template');
  if (!raw || typeof raw !== 'object') {
    return { rescheduleReasons: [] };
  }
  const reasonsRaw = (raw as { rescheduleReasons?: unknown }).rescheduleReasons;
  const rescheduleReasons = Array.isArray(reasonsRaw)
    ? reasonsRaw
        .map((item) => normalizeReasonOption(item))
        .filter((item): item is FineractLoanRescheduleReasonOption => item != null)
    : [];
  return { rescheduleReasons };
}

export async function listLoanRescheduleRequests(
  loanId: string | number
): Promise<FineractLoanRescheduleRequest[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/rescheduleloans', { loanId: String(loanId) });
  return normalizeRequestList(raw);
}

export async function createLoanRescheduleRequest(
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>('/rescheduleloans', body);
}

export async function executeLoanRescheduleRequestCommand(
  requestId: string | number,
  command: 'approve' | 'reject',
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/rescheduleloans/${requestId}`,
    body,
    { command }
  );
}
