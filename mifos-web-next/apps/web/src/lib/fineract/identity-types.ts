import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { IdentityType,
  IdentityTypeCodeValueOption,
  IdentityTypeMutationResponse,
  IdentityTypeTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import {
  buildUpdateIdentityTypePayload,
  buildUpsertIdentityTypePayload,
  type IdentityTypeUpdateClearFields,
  type UpdateIdentityTypePayload,
  type UpsertIdentityTypePayload
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/identitytypes';

function normalizeCodeValueOption(raw: unknown): IdentityTypeCodeValueOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    position: row.position != null ? Number(row.position) : undefined,
    active: row.active === true
  };
}

function normalizeIdentityType(raw: unknown): IdentityType | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const codeValueId = Number(row.codeValueId);
  const codeValueName = typeof row.codeValueName === 'string' ? row.codeValueName : '';
  if (!Number.isFinite(id) || !Number.isFinite(codeValueId) || !codeValueName) {
    return null;
  }
  return {
    id,
    codeValueId,
    codeValueName,
    example: typeof row.example === 'string' ? row.example : undefined,
    formatDescription:
      typeof row.formatDescription === 'string' ? row.formatDescription : undefined,
    validationMessage:
      typeof row.validationMessage === 'string' ? row.validationMessage : undefined,
    validationRegex: typeof row.validationRegex === 'string' ? row.validationRegex : undefined,
    displayOrder: row.displayOrder != null ? Number(row.displayOrder) : undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeTemplate(raw: unknown): IdentityTypeTemplate {
  if (!raw || typeof raw !== 'object') {
    return { codeValueOptions: [], statusOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const codeValueOptions = Array.isArray(row.codeValueOptions)
    ? row.codeValueOptions
        .map((item) => normalizeCodeValueOption(item))
        .filter((item): item is IdentityTypeCodeValueOption => item !== null)
    : [];
  const statusOptions = Array.isArray(row.statusOptions)
    ? row.statusOptions.filter((item): item is string => typeof item === 'string')
    : [];
  return { codeValueOptions, statusOptions };
}

export async function listIdentityTypes(): Promise<IdentityType[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeIdentityType(item))
    .filter((item): item is IdentityType => item !== null)
    .sort((left, right) => {
      const orderDiff = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return left.codeValueName.localeCompare(right.codeValueName);
    });
}

export async function getIdentityTypeTemplate(): Promise<IdentityTypeTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function getIdentityType(identityTypeId: number): Promise<IdentityType | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${identityTypeId}`);
  return normalizeIdentityType(raw);
}

export async function createIdentityType(
  input: UpsertIdentityTypePayload
): Promise<IdentityTypeMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<IdentityTypeMutationResponse>(
    BASE_PATH,
    buildUpsertIdentityTypePayload(input)
  );
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateIdentityType(
  identityTypeId: number,
  input: UpdateIdentityTypePayload,
  clear: IdentityTypeUpdateClearFields
): Promise<IdentityTypeMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<IdentityTypeMutationResponse>(
    `${BASE_PATH}/${identityTypeId}`,
    buildUpdateIdentityTypePayload(input, clear)
  );
  return { resourceId: Number(raw?.resourceId ?? identityTypeId) };
}

export async function deleteIdentityType(identityTypeId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${BASE_PATH}/${identityTypeId}`);
}
