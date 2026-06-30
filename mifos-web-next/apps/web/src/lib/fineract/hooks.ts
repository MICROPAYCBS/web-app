import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookDetail,
  FineractHookListItem,
  FineractHookMutationResponse,
  FineractHookTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import { buildHookApiPayload, type UpsertHookFormInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const HOOKS_PATH = '/hooks';

function normalizeHookListItem(raw: unknown): FineractHookListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const displayName = typeof row.displayName === 'string' ? row.displayName.trim() : '';
  if (!Number.isFinite(id) || !name || !displayName) {
    return null;
  }
  return {
    id,
    name,
    displayName,
    isActive: row.isActive === true
  };
}

function normalizeHookDetail(raw: unknown): FineractHookDetail | null {
  const summary = normalizeHookListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...summary,
    createdAt:
      typeof row.createdAt === 'string' || Array.isArray(row.createdAt)
        ? (row.createdAt as string | number[])
        : undefined,
    updatedAt:
      typeof row.updatedAt === 'string' || Array.isArray(row.updatedAt)
        ? (row.updatedAt as string | number[])
        : undefined,
    templateId: Number.isFinite(Number(row.templateId)) ? Number(row.templateId) : undefined,
    templateName: typeof row.templateName === 'string' ? row.templateName : undefined,
    events: Array.isArray(row.events)
      ? row.events
          .map((event) => {
            if (!event || typeof event !== 'object') {
              return null;
            }
            const item = event as Record<string, unknown>;
            const entityName = typeof item.entityName === 'string' ? item.entityName : '';
            const actionName = typeof item.actionName === 'string' ? item.actionName : '';
            if (!entityName || !actionName) {
              return null;
            }
            return { entityName, actionName };
          })
          .filter((event): event is NonNullable<typeof event> => event !== null)
      : [],
    config: Array.isArray(row.config)
      ? row.config.filter((field): field is NonNullable<typeof field> => field != null)
      : []
  };
}

export async function listHooks(): Promise<FineractHookListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(HOOKS_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeHookListItem(item))
    .filter((item): item is FineractHookListItem => item !== null)
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function getHookTemplate(): Promise<FineractHookTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<FineractHookTemplate>(`${HOOKS_PATH}/template`);
}

export async function getHook(hookId: number): Promise<FineractHookDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${HOOKS_PATH}/${hookId}`);
  return normalizeHookDetail(raw);
}

export async function createHook(input: UpsertHookFormInput): Promise<FineractHookMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractHookMutationResponse>(HOOKS_PATH, buildHookApiPayload(input));
}

export async function updateHook(
  hookId: number,
  input: UpsertHookFormInput
): Promise<FineractHookMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractHookMutationResponse>(
    `${HOOKS_PATH}/${hookId}`,
    buildHookApiPayload(input)
  );
}

export async function deleteHook(hookId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${HOOKS_PATH}/${hookId}`);
}
