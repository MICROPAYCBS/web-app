/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type {
  LoanDelinquencyPauseInput,
  LoanDelinquencyResumeInput
} from '@mifos/validation';
import type {
  LoanDelinquencyActionRecord,
  LoanDelinquencyTagRecord
} from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';

export type { LoanDelinquencyActionRecord, LoanDelinquencyTagRecord };

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

function normalizeDate(raw: unknown): number[] | string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    return raw as number[];
  }
  return undefined;
}

function normalizeTag(raw: unknown): LoanDelinquencyTagRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const range =
    row.delinquencyRange && typeof row.delinquencyRange === 'object'
      ? (row.delinquencyRange as Record<string, unknown>)
      : undefined;
  return {
    id,
    classification:
      typeof range?.classification === 'string'
        ? range.classification
        : typeof row.classification === 'string'
          ? row.classification
          : undefined,
    addedOnDate: normalizeDate(row.addedOnDate),
    liftedOnDate: normalizeDate(row.liftedOnDate)
  };
}

function normalizeAction(raw: unknown): LoanDelinquencyActionRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = toNumber(row.id);
  if (id == null) {
    return null;
  }
  const actionRaw = row.action;
  const action =
    typeof actionRaw === 'string'
      ? actionRaw
      : actionRaw && typeof actionRaw === 'object' && typeof (actionRaw as { name?: string }).name === 'string'
        ? (actionRaw as { name: string }).name
        : undefined;
  return {
    id,
    action,
    startDate: normalizeDate(row.startDate),
    endDate: normalizeDate(row.endDate),
    createdOn: normalizeDate(row.createdOn)
  };
}

export async function getLoanDelinquencyTags(
  accountId: string | number
): Promise<LoanDelinquencyTagRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/delinquencytags`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeTag(item))
    .filter((item): item is LoanDelinquencyTagRecord => item != null);
}

export async function getLoanDelinquencyActions(
  accountId: string | number
): Promise<LoanDelinquencyActionRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/delinquency-actions`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeAction(item))
    .filter((item): item is LoanDelinquencyActionRecord => item != null);
}

export async function createLoanDelinquencyPause(
  accountId: string | number,
  input: LoanDelinquencyPauseInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/delinquency-actions`,
    buildFineractCommandBody({
      action: 'pause',
      startDate: input.startDate,
      endDate: input.endDate
    })
  );
}

export async function createLoanDelinquencyResume(
  accountId: string | number,
  input: LoanDelinquencyResumeInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/delinquency-actions`,
    buildFineractCommandBody({
      action: 'resume',
      startDate: input.startDate
    })
  );
}
