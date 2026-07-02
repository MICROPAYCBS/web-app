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
import type { Sector } from '@/lib/fineract/sectors';

const BASE_PATH = '/industries';

export type Industry = {
  id: number;
  industryCode: string;
  industryName: string;
  description?: string;
  sectorId?: number;
  sectorName?: string;
  regulatoryCode?: string;
  riskLevel?: string;
  amlRiskLevel?: string;
  creditRiskLevel?: string;
  priorityIndustry?: boolean;
  prohibitedIndustry?: boolean;
  requiresEdd?: boolean;
  exposureLimit?: number;
  expectedTurnoverMin?: number;
  expectedTurnoverMax?: number;
  status?: string;
};

export type IndustryTemplate = {
  statusOptions: string[];
  sectorOptions: Sector[];
};

export type IndustryMutationResponse = {
  resourceId: number;
};

export type UpsertIndustryInput = {
  industryCode: string;
  industryName: string;
  description?: string;
  sectorId?: number;
  regulatoryCode?: string;
  riskLevel?: string;
  amlRiskLevel?: string;
  creditRiskLevel?: string;
  priorityIndustry?: boolean;
  prohibitedIndustry?: boolean;
  requiresEdd?: boolean;
  exposureLimit?: number;
  expectedTurnoverMin?: number;
  expectedTurnoverMax?: number;
  status?: string;
};

function normalizeIndustry(raw: unknown): Industry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const industryCode = typeof row.industryCode === 'string' ? row.industryCode : '';
  const industryName = typeof row.industryName === 'string' ? row.industryName : '';
  if (!Number.isFinite(id) || !industryCode || !industryName) {
    return null;
  }
  return {
    id,
    industryCode,
    industryName,
    description: typeof row.description === 'string' ? row.description : undefined,
    sectorId: row.sectorId != null ? Number(row.sectorId) : undefined,
    sectorName: typeof row.sectorName === 'string' ? row.sectorName : undefined,
    regulatoryCode: typeof row.regulatoryCode === 'string' ? row.regulatoryCode : undefined,
    riskLevel: typeof row.riskLevel === 'string' ? row.riskLevel : undefined,
    amlRiskLevel: typeof row.amlRiskLevel === 'string' ? row.amlRiskLevel : undefined,
    creditRiskLevel: typeof row.creditRiskLevel === 'string' ? row.creditRiskLevel : undefined,
    priorityIndustry: row.priorityIndustry === true,
    prohibitedIndustry: row.prohibitedIndustry === true,
    requiresEdd: row.requiresEdd === true,
    exposureLimit: row.exposureLimit != null ? Number(row.exposureLimit) : undefined,
    expectedTurnoverMin: row.expectedTurnoverMin != null ? Number(row.expectedTurnoverMin) : undefined,
    expectedTurnoverMax: row.expectedTurnoverMax != null ? Number(row.expectedTurnoverMax) : undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeSectorOption(raw: unknown): Sector | null {
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
  return { id, sectorCode, sectorName };
}

function normalizeTemplate(raw: unknown): IndustryTemplate {
  if (!raw || typeof raw !== 'object') {
    return { statusOptions: [], sectorOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const statusOptions = Array.isArray(row.statusOptions)
    ? row.statusOptions.filter((item): item is string => typeof item === 'string')
    : [];
  const sectorOptions = Array.isArray(row.sectorOptions)
    ? row.sectorOptions.map((item) => normalizeSectorOption(item)).filter((item): item is Sector => item !== null)
    : [];
  return { statusOptions, sectorOptions };
}

export async function listIndustries(): Promise<Industry[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeIndustry(item))
    .filter((item): item is Industry => item !== null)
    .sort((left, right) => left.industryName.localeCompare(right.industryName));
}

export async function getIndustryTemplate(): Promise<IndustryTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function createIndustry(input: UpsertIndustryInput): Promise<IndustryMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<IndustryMutationResponse>(BASE_PATH, input);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateIndustry(
  industryId: number,
  input: UpsertIndustryInput
): Promise<IndustryMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<IndustryMutationResponse>(`${BASE_PATH}/${industryId}`, input);
  return { resourceId: Number(raw?.resourceId ?? industryId) };
}

export async function deleteIndustry(industryId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${BASE_PATH}/${industryId}`);
}
