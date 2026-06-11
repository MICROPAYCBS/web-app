import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  TaxComponentOption,
  TaxGroupAssociation,
  TaxGroupDetail,
  TaxGroupListItem,
  TaxGroupTemplate,
  TaxMutationResponse
} from '@mifos/api-client';
import type { TaxGroupMemberInput, UpsertTaxGroupInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function normalizeTaxComponentOption(raw: unknown): TaxComponentOption | null {
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
    name: typeof row.name === 'string' ? row.name : undefined
  };
}

function normalizeAssociation(raw: unknown): TaxGroupAssociation | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const taxComponentRaw = row.taxComponent;
  if (!Number.isFinite(id) || !taxComponentRaw || typeof taxComponentRaw !== 'object') {
    return null;
  }
  const taxComponentRow = taxComponentRaw as Record<string, unknown>;
  const taxComponentId = Number(taxComponentRow.id);
  if (!Number.isFinite(taxComponentId)) {
    return null;
  }
  return {
    id,
    taxComponent: {
      id: taxComponentId,
      name: typeof taxComponentRow.name === 'string' ? taxComponentRow.name : undefined,
      glCode: typeof taxComponentRow.glCode === 'string' ? taxComponentRow.glCode : undefined
    },
    startDate: Array.isArray(row.startDate)
      ? (row.startDate as number[])
      : typeof row.startDate === 'string'
        ? row.startDate
        : undefined,
    endDate: Array.isArray(row.endDate)
      ? (row.endDate as number[])
      : typeof row.endDate === 'string'
        ? row.endDate
        : undefined
  };
}

function normalizeListItem(item: unknown): TaxGroupListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const associations = Array.isArray(row.taxAssociations)
    ? row.taxAssociations
        .map((entry) => normalizeAssociation(entry))
        .filter((entry): entry is TaxGroupAssociation => entry !== null)
    : [];
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    taxAssociations: associations
  };
}

function normalizeList(value: unknown): TaxGroupListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is TaxGroupListItem => item !== null);
  }
  return [];
}

function normalizeDetail(raw: unknown): TaxGroupDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const listItem = normalizeListItem(raw);
  if (!listItem) {
    return null;
  }
  const taxComponents = Array.isArray(row.taxComponents)
    ? row.taxComponents
        .map((item) => normalizeTaxComponentOption(item))
        .filter((item): item is TaxComponentOption => item !== null)
    : undefined;
  return {
    id: listItem.id,
    name: listItem.name,
    taxAssociations: listItem.taxAssociations ?? [],
    taxComponents
  };
}

function buildMemberPayload(member: TaxGroupMemberInput): Record<string, unknown> {
  if (member.isNew) {
    return {
      taxComponentId: member.taxComponentId,
      startDate: normalizeFineractDateField(member.startDate)
    };
  }
  if (member.endDate) {
    return {
      id: member.id,
      endDate: normalizeFineractDateField(member.endDate)
    };
  }
  const payload: Record<string, unknown> = {
    id: member.id,
    taxComponentId: member.taxComponentId
  };
  if (member.startDate) {
    payload.startDate = normalizeFineractDateField(member.startDate);
  }
  return payload;
}

function upsertPayload(input: UpsertTaxGroupInput) {
  return {
    name: input.name,
    taxComponents: input.taxComponents.map((member) => buildMemberPayload(member)),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
}

export async function listTaxGroups(): Promise<TaxGroupListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/taxes/group');
  return normalizeList(data);
}

export async function getTaxGroupTemplate(): Promise<TaxGroupTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/taxes/group/template');
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    taxComponents: Array.isArray(row.taxComponents)
      ? row.taxComponents
          .map((item) => normalizeTaxComponentOption(item))
          .filter((item): item is TaxComponentOption => item !== null)
      : []
  };
}

export async function getTaxGroup(
  taxGroupId: string | number,
  template = false
): Promise<TaxGroupDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/taxes/group/${taxGroupId}`, {
    template: template ? 'true' : 'false'
  });
  const detail = normalizeDetail(raw);
  if (!detail) {
    throw new Error('Tax group not found.');
  }
  return detail;
}

export async function createTaxGroup(input: UpsertTaxGroupInput): Promise<TaxMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<TaxMutationResponse>('/taxes/group', upsertPayload(input));
}

export async function updateTaxGroup(
  taxGroupId: string | number,
  input: UpsertTaxGroupInput
): Promise<TaxMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<TaxMutationResponse>(`/taxes/group/${taxGroupId}`, upsertPayload(input));
}
