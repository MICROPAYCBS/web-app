import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractTemplateDetail,
  FineractTemplateFormTemplate,
  FineractTemplateListItem,
  FineractTemplateMapper,
  FineractTemplateMutationResponse,
  FineractTemplateOption
} from '@mifos/api-client';
import { buildTemplateApiPayload, type UpsertTemplateFormInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import { resolveEntityId, resolveTypeId } from '@/lib/fineract/template-display';

const TEMPLATES_PATH = '/templates';

function normalizeTemplateOption(raw: unknown): FineractTemplateOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { id, name };
}

function normalizeTemplateMapper(raw: unknown): FineractTemplateMapper | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const mappersorder = Number(row.mappersorder);
  const mapperskey = typeof row.mapperskey === 'string' ? row.mapperskey : '';
  const mappersvalue = typeof row.mappersvalue === 'string' ? row.mappersvalue : '';
  if (!Number.isFinite(mappersorder) || !mapperskey || !mappersvalue) {
    return null;
  }
  return {
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    mappersorder,
    mapperskey,
    mappersvalue
  };
}

function normalizeTemplateListItem(raw: unknown): FineractTemplateListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const entityRaw = row.entity;
  const typeRaw = row.type;
  const entityId =
    typeof entityRaw === 'number'
      ? entityRaw
      : typeof entityRaw === 'string' && Number.isFinite(Number(entityRaw))
        ? Number(entityRaw)
        : undefined;
  const typeId =
    typeof typeRaw === 'number'
      ? typeRaw
      : typeof typeRaw === 'string' && Number.isFinite(Number(typeRaw))
        ? Number(typeRaw)
        : undefined;

  return {
    id,
    name,
    entity:
      typeof entityRaw === 'string'
        ? entityRaw
        : entityId != null
          ? String(entityId)
          : '—',
    type:
      typeof typeRaw === 'string' ? typeRaw : typeId != null ? String(typeId) : '—',
    entityId,
    typeId
  };
}

function normalizeTemplateDetail(raw: unknown): FineractTemplateDetail | null {
  const summary = normalizeTemplateListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const text = typeof row.text === 'string' ? row.text : '';
  return {
    ...summary,
    text,
    mappers: Array.isArray(row.mappers)
      ? row.mappers
          .map((item) => normalizeTemplateMapper(item))
          .filter((item): item is FineractTemplateMapper => item !== null)
      : []
  };
}

function normalizeTemplateFormTemplate(raw: unknown): FineractTemplateFormTemplate {
  if (!raw || typeof raw !== 'object') {
    return { entities: [], types: [] };
  }
  const row = raw as Record<string, unknown>;
  const entities = Array.isArray(row.entities)
    ? row.entities
        .map((item) => normalizeTemplateOption(item))
        .filter((item): item is FineractTemplateOption => item !== null)
    : [];
  const types = Array.isArray(row.types)
    ? row.types
        .map((item) => normalizeTemplateOption(item))
        .filter((item): item is FineractTemplateOption => item !== null)
    : [];

  const template = row.template != null ? normalizeTemplateDetail(row.template) : null;

  return {
    entities,
    types,
    ...(template ? { template } : {})
  };
}

function enrichListItem(
  item: FineractTemplateListItem,
  formTemplate: FineractTemplateFormTemplate
): FineractTemplateListItem {
  const entityId = item.entityId ?? resolveEntityId(item.entity, formTemplate.entities);
  const typeId = item.typeId ?? resolveTypeId(item.type, formTemplate.types);
  const entityOption = formTemplate.entities.find((option) => option.id === entityId);
  const typeOption = formTemplate.types.find((option) => option.id === typeId);

  return {
    ...item,
    entityId,
    typeId,
    entity: entityOption?.name ?? item.entity,
    type: typeOption?.name ?? item.type
  };
}

export async function getTemplateFormTemplate(): Promise<FineractTemplateFormTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${TEMPLATES_PATH}/template`);
  return normalizeTemplateFormTemplate(raw);
}

export async function getTemplateEditFormTemplate(
  templateId: number
): Promise<FineractTemplateFormTemplate | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${TEMPLATES_PATH}/${templateId}/template`);
  const formTemplate = normalizeTemplateFormTemplate(raw);
  if (!formTemplate.template) {
    return null;
  }
  return formTemplate;
}

export async function listTemplates(): Promise<FineractTemplateListItem[]> {
  const fineract = await createFineractClient();
  const [raw, formTemplate] = await Promise.all([
    fineract.get<unknown>(TEMPLATES_PATH),
    getTemplateFormTemplate()
  ]);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeTemplateListItem(item))
    .filter((item): item is FineractTemplateListItem => item !== null)
    .map((item) => enrichListItem(item, formTemplate))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTemplate(templateId: number): Promise<FineractTemplateDetail | null> {
  const fineract = await createFineractClient();
  const [raw, formTemplate] = await Promise.all([
    fineract.get<unknown>(`${TEMPLATES_PATH}/${templateId}`),
    getTemplateFormTemplate()
  ]);
  const detail = normalizeTemplateDetail(raw);
  if (!detail) {
    return null;
  }
  return enrichListItem(detail, formTemplate) as FineractTemplateDetail;
}

export async function createTemplate(
  input: UpsertTemplateFormInput
): Promise<FineractTemplateMutationResponse> {
  const fineract = await createFineractClient();
  const payload = buildTemplateApiPayload(input);
  const raw = await fineract.post<FineractTemplateMutationResponse>(TEMPLATES_PATH, payload);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateTemplate(
  templateId: number,
  input: UpsertTemplateFormInput
): Promise<void> {
  const fineract = await createFineractClient();
  const payload = buildTemplateApiPayload(input);
  await fineract.put(`${TEMPLATES_PATH}/${templateId}`, payload);
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${TEMPLATES_PATH}/${templateId}`);
}
