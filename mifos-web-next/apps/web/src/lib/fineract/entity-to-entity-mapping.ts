import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  EntityMappingFilterOptions,
  EntityMappingOption,
  FineractEntityMappingDetail,
  FineractEntityMappingRow,
  FineractEntityMappingType
} from '@mifos/api-client';
import type { UpsertEntityMappingInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import { listCharges } from '@/lib/fineract/charges';
import {
  chargeOptions,
  entityMappingFilterLabels,
  loanProductOptions,
  savingsProductOptions
} from '@/lib/fineract/entity-mapping-display';
import { listLoanProducts } from '@/lib/fineract/loan-products';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { listRoleOptions } from '@/lib/fineract/roles';
import { listSavingsProducts } from '@/lib/fineract/savings-products';
import {
  normalizeFineractDateField,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

const BASE_PATH = '/entitytoentitymapping';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

/** Fineract list endpoints return JSON arrays; unwrap common wrappers defensively. */
function unwrapFineractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  const row = asRecord(raw);
  if (!row) {
    return [];
  }
  for (const key of ['pageItems', 'entityMappings', 'entityMappingList', 'data']) {
    const value = row[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function normalizeMappingTypes(raw: unknown): FineractEntityMappingType[] {
  return unwrapFineractList(raw)
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const id = readNumber(row, 'id', 'relationId', 'relId');
      const mappingTypes = readString(row, 'mappingTypes', 'mapping_Types', 'codeName', 'code_name');
      if (id == null || !mappingTypes) {
        return null;
      }
      return { id, mappingTypes };
    })
    .filter((item): item is FineractEntityMappingType => item !== null)
    .sort((left, right) => left.id - right.id);
}

function entityDisplayName(
  row: Record<string, unknown>,
  nameKeys: string[],
  idKeys: string[],
  fallbackPrefix: string
): string {
  const named = readString(row, ...nameKeys);
  if (named) {
    return named;
  }
  const id = readNumber(row, ...idKeys);
  return id != null ? `${fallbackPrefix} #${id}` : fallbackPrefix;
}

function normalizeMappingRows(raw: unknown): FineractEntityMappingRow[] {
  return unwrapFineractList(raw)
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const mapId = readNumber(row, 'mapId', 'id');
      const fromId = readNumber(row, 'fromId', 'from_id');
      const toId = readNumber(row, 'toId', 'to_id');
      if (mapId == null) {
        return null;
      }

      const fromEntity = entityDisplayName(
        row,
        ['fromEntity', 'from_name', 'fromName'],
        ['fromId', 'from_id'],
        'From entity'
      );
      const toEntity = entityDisplayName(
        row,
        ['toEntity', 'to_name', 'toName'],
        ['toId', 'to_id'],
        'To entity'
      );

      const mapped: FineractEntityMappingRow = {
        mapId,
        fromEntity,
        toEntity
      };
      if (row.startDate != null) {
        mapped.startDate = row.startDate as FineractEntityMappingRow['startDate'];
      }
      if (row.endDate != null) {
        mapped.endDate = row.endDate as FineractEntityMappingRow['endDate'];
      }
      if (fromId != null) {
        (mapped as FineractEntityMappingRow & { fromId?: number }).fromId = fromId;
      }
      if (toId != null) {
        (mapped as FineractEntityMappingRow & { toId?: number }).toId = toId;
      }
      return mapped;
    })
    .filter((item): item is FineractEntityMappingRow => item !== null);
}

function normalizeMappingDetail(raw: unknown): FineractEntityMappingDetail | null {
  const list = unwrapFineractList(raw);
  const source = list.length > 0 ? list[0] : raw;
  const row = asRecord(source);
  if (!row) {
    return null;
  }
  return {
    mapId: readNumber(row, 'mapId', 'id'),
    relId: readNumber(row, 'relId', 'relationId', 'rel_id'),
    fromId: readNumber(row, 'fromId', 'from_id'),
    toId: readNumber(row, 'toId', 'to_id'),
    startDate: row.startDate as FineractEntityMappingDetail['startDate'],
    endDate: row.endDate as FineractEntityMappingDetail['endDate']
  };
}

function buildUpsertPayload(input: UpsertEntityMappingInput) {
  const ctx = resolveFineractDateContext(input);
  return {
    fromId: input.fromId,
    toId: input.toId,
    startDate: normalizeFineractDateField(input.startDate, ctx),
    endDate: normalizeFineractDateField(input.endDate, ctx),
    dateFormat: ctx.dateFormat,
    locale: ctx.locale
  };
}

export async function listEntityMappingTypes(): Promise<FineractEntityMappingType[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  return normalizeMappingTypes(raw);
}

export async function listEntityMappingsForFilter(
  relationId: number,
  fromId: number,
  toId: number
): Promise<FineractEntityMappingRow[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${relationId}/${fromId}/${toId}`);
  return normalizeMappingRows(raw);
}

export async function getEntityMapping(mapId: number): Promise<FineractEntityMappingDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${mapId}`);
  return normalizeMappingDetail(raw);
}

export async function getEntityMappingFilterOptions(
  mappingType: Pick<FineractEntityMappingType, 'id' | 'mappingTypes'>
): Promise<EntityMappingFilterOptions> {
  const labels = entityMappingFilterLabels(mappingType.mappingTypes);
  let fromOptions: EntityMappingOption[] = [];
  let toOptions: EntityMappingOption[] = [];

  switch (mappingType.mappingTypes) {
    case 'office_access_to_loan_products': {
      const [offices, products] = await Promise.all([
        listOfficeOptions(),
        listLoanProducts('loan')
      ]);
      fromOptions = offices.map((office) => ({
        id: office.id,
        name: office.name?.trim() || office.nameDecorated?.trim() || String(office.id)
      }));
      toOptions = loanProductOptions(products);
      break;
    }
    case 'office_access_to_savings_products': {
      const [offices, products] = await Promise.all([
        listOfficeOptions(),
        listSavingsProducts()
      ]);
      fromOptions = offices.map((office) => ({
        id: office.id,
        name: office.name?.trim() || office.nameDecorated?.trim() || String(office.id)
      }));
      toOptions = savingsProductOptions(products);
      break;
    }
    case 'office_access_to_fees/charges': {
      const [offices, charges] = await Promise.all([listOfficeOptions(), listCharges()]);
      fromOptions = offices.map((office) => ({
        id: office.id,
        name: office.name?.trim() || office.nameDecorated?.trim() || String(office.id)
      }));
      toOptions = chargeOptions(charges);
      break;
    }
    case 'role_access_to_loan_products': {
      const [roles, products] = await Promise.all([
        listRoleOptions(),
        listLoanProducts('loan')
      ]);
      fromOptions = roles;
      toOptions = loanProductOptions(products);
      break;
    }
    case 'role_access_to_savings_products': {
      const [roles, products] = await Promise.all([
        listRoleOptions(),
        listSavingsProducts()
      ]);
      fromOptions = roles;
      toOptions = savingsProductOptions(products);
      break;
    }
    default:
      break;
  }

  return {
    ...labels,
    fromOptions,
    toOptions
  };
}

export async function createEntityMapping(
  relationId: number,
  input: UpsertEntityMappingInput
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${BASE_PATH}/${relationId}`, buildUpsertPayload(input));
}

export async function updateEntityMapping(
  mapId: number,
  input: UpsertEntityMappingInput
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${BASE_PATH}/${mapId}`, buildUpsertPayload(input));
}

export async function deleteEntityMapping(mapId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${BASE_PATH}/${mapId}`);
}
