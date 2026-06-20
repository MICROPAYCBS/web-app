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
  FineractTemplateMapper,
  FineractTemplateOption
} from '@mifos/api-client';
import type { UpsertTemplateFormInput } from '@mifos/validation';

export const CLIENT_ENTITY_ID = 0;
export const LOAN_ENTITY_ID = 1;

const FALLBACK_ENTITY_LABELS: Record<number, string> = {
  [CLIENT_ENTITY_ID]: 'Customer',
  [LOAN_ENTITY_ID]: 'Loan'
};

const FALLBACK_TYPE_LABELS: Record<number, string> = {
  0: 'Document',
  1: 'E-Mail',
  2: 'SMS'
};

export function templateOptionLabel(option: FineractTemplateOption) {
  return option.name;
}

export function resolveEntityLabel(
  value: string | number | undefined,
  options: FineractTemplateOption[] = []
) {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    const match = options.find((option) => option.id === value);
    return match?.name ?? FALLBACK_ENTITY_LABELS[value] ?? String(value);
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const match = options.find((option) => option.id === numeric);
    return match?.name ?? FALLBACK_ENTITY_LABELS[numeric] ?? value;
  }
  const byName = options.find((option) => option.name.toLowerCase() === value.toLowerCase());
  return byName?.name ?? value;
}

export function resolveTypeLabel(
  value: string | number | undefined,
  options: FineractTemplateOption[] = []
) {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    const match = options.find((option) => option.id === value);
    return match?.name ?? FALLBACK_TYPE_LABELS[value] ?? String(value);
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const match = options.find((option) => option.id === numeric);
    return match?.name ?? FALLBACK_TYPE_LABELS[numeric] ?? value;
  }
  const byName = options.find((option) => option.name.toLowerCase() === value.toLowerCase());
  return byName?.name ?? value;
}

export function resolveEntityId(
  value: string | number | undefined,
  options: FineractTemplateOption[]
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const byName = options.find((option) => option.name.toLowerCase() === value.toLowerCase());
    if (byName) {
      return byName.id;
    }
  }
  return undefined;
}

export function resolveTypeId(
  value: string | number | undefined,
  options: FineractTemplateOption[]
): number | undefined {
  return resolveEntityId(value, options);
}

export function defaultTemplateMapper(entityId: number): FineractTemplateMapper {
  if (entityId === CLIENT_ENTITY_ID) {
    return {
      mappersorder: 0,
      mapperskey: 'client',
      mappersvalue: 'clients/{{clientId}}?tenantIdentifier={{tenantIdentifier}}'
    };
  }

  return {
    mappersorder: 0,
    mapperskey: 'loan',
    mappersvalue: 'loans/{{loanId}}?associations=all&tenantIdentifier={{tenantIdentifier}}'
  };
}

export function defaultTemplateFormValues(
  formTemplate: FineractTemplateFormTemplate
): UpsertTemplateFormInput {
  const defaultEntity =
    formTemplate.entities.find((option) => option.id === CLIENT_ENTITY_ID)?.id ??
    formTemplate.entities[0]?.id ??
    CLIENT_ENTITY_ID;
  const defaultType = formTemplate.types[0]?.id ?? 0;

  return {
    entity: defaultEntity,
    type: defaultType,
    name: '',
    text: '',
    mappers: [defaultTemplateMapper(defaultEntity)]
  };
}

export function templateToFormValues(
  detail: FineractTemplateDetail,
  formTemplate: FineractTemplateFormTemplate
): UpsertTemplateFormInput {
  const entity =
    detail.entityId ??
    resolveEntityId(detail.entity, formTemplate.entities) ??
    CLIENT_ENTITY_ID;
  const type =
    detail.typeId ?? resolveTypeId(detail.type, formTemplate.types) ?? 0;

  return {
    entity,
    type,
    name: detail.name,
    text: detail.text,
    mappers:
      detail.mappers.length > 0
        ? detail.mappers.map((mapper) => ({
            id: mapper.id,
            mappersorder: mapper.mappersorder,
            mapperskey: mapper.mapperskey,
            mappersvalue: mapper.mappersvalue
          }))
        : [defaultTemplateMapper(entity)]
  };
}
