import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCobCatchUpStatus, FineractLockedLoan, FineractLockedLoansPage, FineractCommandProcessingResult } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const LOANS_PATH = '/loans';

function normalizeLockedLoan(raw: unknown): FineractLockedLoan | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const loanId = Number(row.loanId);
  if (!Number.isFinite(loanId)) {
    return null;
  }
  return {
    loanId,
    lockPlacedOn:
      typeof row.lockPlacedOn === 'string' || Array.isArray(row.lockPlacedOn)
        ? (row.lockPlacedOn as string | number[])
        : undefined,
    lockOwner: typeof row.lockOwner === 'string' ? row.lockOwner : undefined,
    error: typeof row.error === 'string' ? row.error : undefined,
    stacktrace: typeof row.stacktrace === 'string' ? row.stacktrace : undefined
  };
}

export async function getCobCatchUpStatus(): Promise<FineractCobCatchUpStatus> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${LOANS_PATH}/is-catch-up-running`);
  if (!raw || typeof raw !== 'object') {
    return { isCatchUpRunning: false };
  }
  return { isCatchUpRunning: (raw as Record<string, unknown>).isCatchUpRunning === true };
}

export async function startCobCatchUp(): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`${LOANS_PATH}/catch-up`, {});
}

export async function listLockedLoans(page = 0, limit = 5000): Promise<FineractLockedLoansPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${LOANS_PATH}/locked`, {
    page: String(page),
    limit: String(limit)
  });
  if (!raw || typeof raw !== 'object') {
    return { content: [] };
  }
  const row = raw as Record<string, unknown>;
  const content = Array.isArray(row.content)
    ? row.content
        .map((item) => normalizeLockedLoan(item))
        .filter((item): item is FineractLockedLoan => item !== null)
    : [];
  return {
    content,
    totalElements: Number.isFinite(Number(row.totalElements)) ? Number(row.totalElements) : content.length
  };
}

export async function getLoanClientId(loanId: number): Promise<number | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${LOANS_PATH}/${loanId}`);
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const clientId = Number((raw as Record<string, unknown>).clientId);
  return Number.isFinite(clientId) ? clientId : null;
}
