import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlClosureDetail,
  FineractGlClosureListItem,
  FineractGlClosureMutationResponse, FineractCommandProcessingResult } from '@mifos/api-client';
import {
  buildCreateGlClosurePayload,
  buildUpdateGlClosurePayload,
  type CreateGlClosureInput,
  type UpdateGlClosureInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const GL_CLOSURES_PATH = '/glclosures';

function normalizeListItem(raw: unknown): FineractGlClosureListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const officeId = Number(row.officeId);
  if (!Number.isFinite(id) || !Number.isFinite(officeId)) {
    return null;
  }
  return {
    id,
    officeId,
    officeName: typeof row.officeName === 'string' ? row.officeName : '',
    closingDate: typeof row.closingDate === 'string' ? row.closingDate : '',
    comments: typeof row.comments === 'string' ? row.comments : '',
    createdByUsername: typeof row.createdByUsername === 'string' ? row.createdByUsername : ''
  };
}

function normalizeDetail(raw: unknown): FineractGlClosureDetail | null {
  const listItem = normalizeListItem(raw);
  if (!listItem || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...listItem,
    createdDate: typeof row.createdDate === 'string' ? row.createdDate : '',
    lastUpdatedByUsername:
      typeof row.lastUpdatedByUsername === 'string' ? row.lastUpdatedByUsername : '',
    lastUpdatedDate: typeof row.lastUpdatedDate === 'string' ? row.lastUpdatedDate : ''
  };
}

function normalizeList(raw: unknown): FineractGlClosureListItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeListItem(item))
      .filter((item): item is FineractGlClosureListItem => item !== null);
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)) {
    return (raw as { pageItems: unknown[] }).pageItems
      .map((item) => normalizeListItem(item))
      .filter((item): item is FineractGlClosureListItem => item !== null);
  }
  return [];
}

export async function listGlClosures(): Promise<FineractGlClosureListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(GL_CLOSURES_PATH);
  return normalizeList(raw).sort((left, right) =>
    right.closingDate.localeCompare(left.closingDate, undefined, { sensitivity: 'base' })
  );
}

export async function getGlClosure(closureId: number): Promise<FineractGlClosureDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${GL_CLOSURES_PATH}/${closureId}`);
  return normalizeDetail(raw);
}

export async function createGlClosure(
  input: CreateGlClosureInput
): Promise<FineractGlClosureMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractGlClosureMutationResponse>(
    GL_CLOSURES_PATH,
    buildCreateGlClosurePayload(input)
  );
}

export async function updateGlClosure(
  closureId: number,
  input: UpdateGlClosureInput
): Promise<FineractGlClosureMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractGlClosureMutationResponse>(
    `${GL_CLOSURES_PATH}/${closureId}`,
    buildUpdateGlClosurePayload(input)
  );
}

export async function deleteGlClosure(closureId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${GL_CLOSURES_PATH}/${closureId}`);
}
