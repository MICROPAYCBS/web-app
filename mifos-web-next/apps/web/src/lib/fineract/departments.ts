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
import {
  DEFAULT_DEPARTMENT_ACTIVE_OPTIONS,
  normalizeDepartmentActiveOption
} from '@/lib/fineract/department-options';
import {
  buildDepartmentsQueryParams,
  type ListDepartmentsFilterInput
} from '@/lib/fineract/department-query';
import type { Department } from '@/lib/fineract/department-types';

export type { ListDepartmentsFilterInput } from '@/lib/fineract/department-query';
export { buildDepartmentsQueryParams } from '@/lib/fineract/department-query';
export type { Department } from '@/lib/fineract/department-types';

const BASE_PATH = '/departments';

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
    return { activeOptions: DEFAULT_DEPARTMENT_ACTIVE_OPTIONS, officeOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const activeOptions = Array.isArray(row.activeOptions)
    ? row.activeOptions
        .map((item) => normalizeDepartmentActiveOption(item))
        .filter((item): item is { value: string; label: string } => item !== null)
    : [];
  const officeOptions = Array.isArray(row.officeOptions)
    ? row.officeOptions
        .map((item) => normalizeOfficeOption(item))
        .filter((item): item is FineractOfficeOption => item !== null)
    : [];
  return {
    activeOptions:
      activeOptions.length > 0 ? activeOptions : DEFAULT_DEPARTMENT_ACTIVE_OPTIONS,
    officeOptions
  };
}

/**
 * List departments. Pass `officeId` for branch-mapped posting pickers
 * (`GET /departments?officeId=`). Omit for the full master list (admin / filters).
 */
export async function listDepartments(
  filters: ListDepartmentsFilterInput = {}
): Promise<Department[]> {
  const fineract = await createFineractClient();
  const params = buildDepartmentsQueryParams(filters);
  const raw = await fineract.get<unknown>(BASE_PATH, params);
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
