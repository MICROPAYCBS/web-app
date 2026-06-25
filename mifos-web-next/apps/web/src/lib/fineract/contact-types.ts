import 'server-only';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type {

  ContactType,

  ContactTypeMutationResponse,

  ContactTypeTemplate

} from '@mifos/api-client';

import {

  buildUpdateContactTypePayload,

  buildUpsertContactTypePayload,

  type ContactTypeUpdateClearFields,

  type UpdateContactTypePayload,

  type UpsertContactTypePayload

} from '@mifos/validation';

import { createFineractClient } from '@/lib/fineract/create-client';



const BASE_PATH = '/contacttypes';



function normalizeContactType(raw: unknown): ContactType | null {

  if (!raw || typeof raw !== 'object') {

    return null;

  }

  const row = raw as Record<string, unknown>;

  const id = Number(row.id);

  const typeCode = typeof row.typeCode === 'string' ? row.typeCode : '';

  const typeName = typeof row.typeName === 'string' ? row.typeName : '';

  if (!Number.isFinite(id) || !typeCode || !typeName) {

    return null;

  }

  return {

    id,

    typeCode,

    typeName,

    example: typeof row.example === 'string' ? row.example : undefined,

    validationRegex: typeof row.validationRegex === 'string' ? row.validationRegex : undefined,

    mandatory: row.mandatory === true,

    displayOrder: row.displayOrder != null ? Number(row.displayOrder) : undefined,

    status: typeof row.status === 'string' ? row.status : undefined

  };

}



function normalizeTemplate(raw: unknown): ContactTypeTemplate {

  if (!raw || typeof raw !== 'object') {

    return { statusOptions: [] };

  }

  const row = raw as Record<string, unknown>;

  const statusOptions = Array.isArray(row.statusOptions)

    ? row.statusOptions.filter((item): item is string => typeof item === 'string')

    : [];

  return { statusOptions };

}



export async function listContactTypes(): Promise<ContactType[]> {

  const fineract = await createFineractClient();

  const raw = await fineract.get<unknown>(BASE_PATH);

  if (!Array.isArray(raw)) {

    return [];

  }

  return raw

    .map((item) => normalizeContactType(item))

    .filter((item): item is ContactType => item !== null)

    .sort((left, right) => {

      const orderDiff = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);

      if (orderDiff !== 0) {

        return orderDiff;

      }

      return left.typeName.localeCompare(right.typeName);

    });

}



export async function getContactTypeTemplate(): Promise<ContactTypeTemplate> {

  const fineract = await createFineractClient();

  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);

  return normalizeTemplate(raw);

}



export async function getContactType(contactTypeId: number): Promise<ContactType | null> {

  const fineract = await createFineractClient();

  const raw = await fineract.get<unknown>(`${BASE_PATH}/${contactTypeId}`);

  return normalizeContactType(raw);

}



export async function createContactType(

  input: UpsertContactTypePayload

): Promise<ContactTypeMutationResponse> {

  const fineract = await createFineractClient();

  const raw = await fineract.post<ContactTypeMutationResponse>(

    BASE_PATH,

    buildUpsertContactTypePayload(input)

  );

  return { resourceId: Number(raw?.resourceId) };

}



export async function updateContactType(

  contactTypeId: number,

  input: UpdateContactTypePayload,

  clear: ContactTypeUpdateClearFields

): Promise<ContactTypeMutationResponse> {

  const fineract = await createFineractClient();

  const raw = await fineract.put<ContactTypeMutationResponse>(

    `${BASE_PATH}/${contactTypeId}`,

    buildUpdateContactTypePayload(input, clear)

  );

  return { resourceId: Number(raw?.resourceId ?? contactTypeId) };

}



export async function deleteContactType(contactTypeId: number): Promise<void> {

  const fineract = await createFineractClient();

  await fineract.delete(`${BASE_PATH}/${contactTypeId}`);

}


