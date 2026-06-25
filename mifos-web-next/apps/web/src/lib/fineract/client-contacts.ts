import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientContact, ClientContactTemplate } from '@mifos/api-client';
import type { ClientContactInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeClientContact(raw: unknown): ClientContact | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const contactTypeId = Number(row.contactTypeId);
  const contactValue = typeof row.contactValue === 'string' ? row.contactValue : '';
  if (!Number.isFinite(id) || !Number.isFinite(contactTypeId) || !contactValue) {
    return null;
  }
  return {
    id,
    clientId: row.clientId != null ? Number(row.clientId) : undefined,
    contactTypeId,
    contactTypeCode: typeof row.contactTypeCode === 'string' ? row.contactTypeCode : undefined,
    contactTypeName: typeof row.contactTypeName === 'string' ? row.contactTypeName : undefined,
    example: typeof row.example === 'string' ? row.example : undefined,
    validationRegex: typeof row.validationRegex === 'string' ? row.validationRegex : undefined,
    mandatory: row.mandatory === true,
    contactValue,
    primary: row.primary === true
  };
}

export async function getClientContacts(clientId: string | number): Promise<ClientContact[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/clients/${clientId}/contacts`);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeClientContact(item))
    .filter((item): item is ClientContact => item !== null);
}

export async function getClientContactTemplate(
  clientId: string | number
): Promise<ClientContactTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<Record<string, unknown>>(`/clients/${clientId}/contacts/template`);
  const options = Array.isArray(raw?.contactTypeOptions) ? raw.contactTypeOptions : [];
  return {
    contactTypeOptions: options
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const row = item as Record<string, unknown>;
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
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  };
}

export async function createClientContact(
  clientId: string | number,
  input: ClientContactInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(`/clients/${clientId}/contacts`, input);
}

export async function updateClientContact(
  clientId: string | number,
  contactId: number,
  input: ClientContactInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.put<{ resourceId: number }>(`/clients/${clientId}/contacts/${contactId}`, input);
}

export async function deleteClientContact(
  clientId: string | number,
  contactId: number
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/clients/${clientId}/contacts/${contactId}`);
}
