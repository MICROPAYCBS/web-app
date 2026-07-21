'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  DEPARTMENT_LIST_PATH,
  departmentEditPath
} from '@/lib/fineract/department-paths';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type UpsertDepartmentInput
} from '@/lib/fineract/departments';
import type { Department } from '@/lib/fineract/department-types';
import { getServerSession } from '@/lib/session/server';

export type DepartmentActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Active departments mapped to a branch for journal / posting dropdowns. */
export async function listDepartmentsForOfficeAction(
  officeId: number
): Promise<DepartmentActionResult & { data?: Department[] }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_DEPARTMENT');
  } catch {
    return { ok: false, message: 'You do not have permission to view departments.' };
  }

  if (!Number.isFinite(officeId) || officeId <= 0) {
    return { ok: false, message: 'Select a branch first.' };
  }

  try {
    const data = await listDepartments({ officeId });
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load departments for this branch.');
  }
}

function validateInput(input: UpsertDepartmentInput): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  if (!input.departmentCode?.trim()) {
    fieldErrors.departmentCode = 'Department code is required.';
  }
  if (!input.departmentName?.trim()) {
    fieldErrors.departmentName = 'Department name is required.';
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function revalidateDepartmentViews(departmentId?: number) {
  revalidatePath(DEPARTMENT_LIST_PATH);
  if (departmentId != null) {
    revalidatePath(departmentEditPath(departmentId));
  }
}

export async function createDepartmentAction(
  input: UpsertDepartmentInput
): Promise<DepartmentActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_DEPARTMENT');
  } catch {
    return { ok: false, message: 'You do not have permission to create departments.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await createDepartment(input);
    revalidateDepartmentViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create department.');
  }
}

export async function updateDepartmentAction(
  departmentId: number,
  input: UpsertDepartmentInput
): Promise<DepartmentActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_DEPARTMENT');
  } catch {
    return { ok: false, message: 'You do not have permission to update departments.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await updateDepartment(departmentId, input);
    revalidateDepartmentViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update department.');
  }
}

export async function deleteDepartmentAction(
  departmentId: number
): Promise<DepartmentActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_DEPARTMENT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete departments.' };
  }

  try {
    await deleteDepartment(departmentId);
    revalidateDepartmentViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete department.');
  }
}
