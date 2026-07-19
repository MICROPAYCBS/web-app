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
import { SECTOR_LIST_PATH, sectorEditPath } from '@/lib/fineract/sector-paths';
import {
  createSector,
  deleteSector,
  updateSector,
  type UpsertSectorInput
} from '@/lib/fineract/sectors';
import { getServerSession } from '@/lib/session/server';

export type SectorActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function validateInput(input: UpsertSectorInput): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  if (!input.sectorCode?.trim()) {
    fieldErrors.sectorCode = 'Sector code is required.';
  }
  if (!input.sectorName?.trim()) {
    fieldErrors.sectorName = 'Sector name is required.';
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function revalidateSectorViews(sectorId?: number) {
  revalidatePath(SECTOR_LIST_PATH);
  if (sectorId != null) {
    revalidatePath(sectorEditPath(sectorId));
  }
}

export async function createSectorAction(input: UpsertSectorInput): Promise<SectorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_SECTOR');
  } catch {
    return { ok: false, message: 'You do not have permission to create sectors.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await createSector(input);
    revalidateSectorViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create sector.');
  }
}

export async function updateSectorAction(
  sectorId: number,
  input: UpsertSectorInput
): Promise<SectorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_SECTOR');
  } catch {
    return { ok: false, message: 'You do not have permission to update sectors.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await updateSector(sectorId, input);
    revalidateSectorViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update sector.');
  }
}

export async function deleteSectorAction(sectorId: number): Promise<SectorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_SECTOR');
  } catch {
    return { ok: false, message: 'You do not have permission to delete sectors.' };
  }

  try {
    await deleteSector(sectorId);
    revalidateSectorViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete sector.');
  }
}
