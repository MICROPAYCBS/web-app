import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult, FineractOfficeOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/departments';

export type Department = {
  id: number;
  departmentCode: string;
  departmentName: string;
  officeId?: number;
  officeName?: string;
  active?: boolean;
};

export type DepartmentTemplate = {
  activeOptions: Array<{ value: string; label: string }>;
  officeOptions: FineractOfficeOption[];
};

export type DepartmentMutationResponse = {
  resourceId: number;
};

export type UpsertDepartmentInput = {
  departmentCode: string;
  departmentName: string;
  officeId?: number;
  active?: boolean;
};

function normalizeDepartment(raw: unknown): Department | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const departmentCode = typeof row.departmentCode === 'string' ? row.departmentCode : '';
  const departmentName = typeof row.departmentName === 'string' ? row.departmentName : '';
  if (!Number.isFinite(id) || !departmentCode || !departmentName) {
    return null;
  }
  return {
    id,
    departmentCode,
    departmentName,
    officeId: row.officeId != null ? Number(row.officeId) : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    active: row.active === true || row.active === false ? row.active : undefined
  };
}

function normalizeOfficeOption(raw: unknown): FineractOfficeOption | null {
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
    name: typeof row.name === 'string' ? row.name : (typeof row.nameDecorated === 'string' ? row.nameDecorated : String(id)),
    nameDecorated: typeof row.nameDecorated === 'string' ? row.nameDecorated : undefined
  };
}

function normalizeTemplate(raw: unknown): DepartmentTemplate {
  if (!raw || typeof raw !== 'object') {
    return { activeOptions: [], officeOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const activeOptions = Array.isArray(row.activeOptions)
    ? row.activeOptions
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const option = item as Record<string, unknown>;
          const value = typeof option.value === 'string' ? option.value : String(option.id ?? '');
          const label = typeof option.value === 'string' ? option.value : String(option.id ?? '');
          if (!value) {
            return null;
          }
          return {
            value,
            label: value === 'true' ? 'Active' : value === 'false' ? 'Inactive' : label
          };
        })
        .filter((item): item is { value: string; label: string } => item !== null)
    : [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ];
  const officeOptions = Array.isArray(row.officeOptions)
    ? row.officeOptions
        .map((item) => normalizeOfficeOption(item))
        .filter((item): item is FineractOfficeOption => item !== null)
    : [];
  return { activeOptions, officeOptions };
}

export async function listDepartments(): Promise<Department[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeDepartment(item))
    .filter((item): item is Department => item !== null)
    .sort((left, right) => left.departmentName.localeCompare(right.departmentName));
}

export async function getDepartmentTemplate(): Promise<DepartmentTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function createDepartment(
  input: UpsertDepartmentInput
): Promise<DepartmentMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<DepartmentMutationResponse>(BASE_PATH, input);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateDepartment(
  departmentId: number,
  input: UpsertDepartmentInput
): Promise<DepartmentMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<DepartmentMutationResponse>(`${BASE_PATH}/${departmentId}`, input);
  return { resourceId: Number(raw?.resourceId ?? departmentId) };
}

export async function deleteDepartment(
  departmentId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${BASE_PATH}/${departmentId}`);
}
