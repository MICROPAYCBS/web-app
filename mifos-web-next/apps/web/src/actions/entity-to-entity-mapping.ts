'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  EntityMappingFilterOptions,
  FineractEntityMappingDetail,
  FineractEntityMappingRow
} from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpsertEntityMapping,
  type UpsertEntityMappingInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createEntityMapping,
  deleteEntityMapping,
  getEntityMapping,
  getEntityMappingFilterOptions,
  listEntityMappingsForFilter,
  updateEntityMapping
} from '@/lib/fineract/entity-to-entity-mapping';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/entity-to-entity-mapping';

export type EntityMappingActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

export async function getEntityMappingFilterOptionsAction(mappingType: {
  id: number;
  mappingTypes: string;
}): Promise<EntityMappingActionResult & { data?: EntityMappingFilterOptions }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to view entity mappings.' };
  }

  try {
    const data = await getEntityMappingFilterOptions(mappingType);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load mapping filter options.');
  }
}

export async function listEntityMappingsForFilterAction(
  relationId: number,
  fromId: number,
  toId: number
): Promise<EntityMappingActionResult & { data?: FineractEntityMappingRow[] }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to view entity mappings.' };
  }

  try {
    const data = await listEntityMappingsForFilter(relationId, fromId, toId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load entity mappings.');
  }
}

export async function getEntityMappingAction(
  mapId: number
): Promise<EntityMappingActionResult & { data?: FineractEntityMappingDetail | null }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to view entity mappings.' };
  }

  try {
    const data = await getEntityMapping(mapId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load mapping details.');
  }
}

export async function createEntityMappingAction(
  mappingTypeId: number,
  input: UpsertEntityMappingInput
): Promise<EntityMappingActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to create entity mappings.' };
  }

  const parsed = validateUpsertEntityMapping(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await createEntityMapping(mappingTypeId, parsed.data);
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create entity mapping.');
  }
}

export async function updateEntityMappingAction(
  mapId: number,
  input: UpsertEntityMappingInput
): Promise<EntityMappingActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to update entity mappings.' };
  }

  const parsed = validateUpsertEntityMapping(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateEntityMapping(mapId, parsed.data);
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update entity mapping.');
  }
}

export async function deleteEntityMappingAction(
  mapId: number
): Promise<EntityMappingActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_ENTITYMAPPING');
  } catch {
    return { ok: false, message: 'You do not have permission to delete entity mappings.' };
  }

  try {
    await deleteEntityMapping(mapId);
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete entity mapping.');
  }
}
