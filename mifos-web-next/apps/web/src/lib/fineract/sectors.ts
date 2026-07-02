import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/sectors';

export type Sector = {
  id: number;
  sectorCode: string;
  sectorName: string;
  description?: string;
  parentId?: number;
  parentSectorName?: string;
  riskLevel?: string;
  regulatoryCode?: string;
  status?: string;
};

export type SectorTemplate = {
  statusOptions: string[];
  parentSectorOptions: Sector[];
};

export type SectorMutationResponse = {
  resourceId: number;
};

export type UpsertSectorInput = {
  sectorCode: string;
  sectorName: string;
  description?: string;
  parentId?: number;
  riskLevel?: string;
  regulatoryCode?: string;
  status?: string;
};

function normalizeSector(raw: unknown): Sector | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const sectorCode = typeof row.sectorCode === 'string' ? row.sectorCode : '';
  const sectorName = typeof row.sectorName === 'string' ? row.sectorName : '';
  if (!Number.isFinite(id) || !sectorCode || !sectorName) {
    return null;
  }
  return {
    id,
    sectorCode,
    sectorName,
    description: typeof row.description === 'string' ? row.description : undefined,
    parentId: row.parentId != null ? Number(row.parentId) : undefined,
    parentSectorName: typeof row.parentSectorName === 'string' ? row.parentSectorName : undefined,
    riskLevel: typeof row.riskLevel === 'string' ? row.riskLevel : undefined,
    regulatoryCode: typeof row.regulatoryCode === 'string' ? row.regulatoryCode : undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeTemplate(raw: unknown): SectorTemplate {
  if (!raw || typeof raw !== 'object') {
    return { statusOptions: [], parentSectorOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const statusOptions = Array.isArray(row.statusOptions)
    ? row.statusOptions.filter((item): item is string => typeof item === 'string')
    : [];
  const parentSectorOptions = Array.isArray(row.parentSectorOptions)
    ? row.parentSectorOptions.map((item) => normalizeSector(item)).filter((item): item is Sector => item !== null)
    : [];
  return { statusOptions, parentSectorOptions };
}

export async function listSectors(): Promise<Sector[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeSector(item))
    .filter((item): item is Sector => item !== null)
    .sort((left, right) => left.sectorName.localeCompare(right.sectorName));
}

export async function getSectorTemplate(): Promise<SectorTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function createSector(input: UpsertSectorInput): Promise<SectorMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<SectorMutationResponse>(BASE_PATH, input);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateSector(
  sectorId: number,
  input: UpsertSectorInput
): Promise<SectorMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<SectorMutationResponse>(`${BASE_PATH}/${sectorId}`, input);
  return { resourceId: Number(raw?.resourceId ?? sectorId) };
}

export async function deleteSector(sectorId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${BASE_PATH}/${sectorId}`);
}
