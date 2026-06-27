/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractClientIdentifier,
  FineractClientIdentifierTemplate,
  FineractEntityDocument,
  ClientIdentifierIdentityTypeOption
} from '@mifos/api-client';
import type { ClientIdentifierInput } from '@mifos/validation';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractRequestInit, fineractUrl } from '@/lib/fineract/fineract-fetch';

function normalizeIdentityTypeOption(raw: unknown): ClientIdentifierIdentityTypeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const codeValueId = Number(row.codeValueId);
  const codeValueName = typeof row.codeValueName === 'string' ? row.codeValueName : '';
  if (!Number.isFinite(id) || !Number.isFinite(codeValueId) || !codeValueName) {
    return null;
  }
  return {
    id,
    codeValueId,
    codeValueName,
    example: typeof row.example === 'string' ? row.example : undefined,
    formatDescription:
      typeof row.formatDescription === 'string' ? row.formatDescription : undefined,
    validationMessage:
      typeof row.validationMessage === 'string' ? row.validationMessage : undefined,
    validationRegex: typeof row.validationRegex === 'string' ? row.validationRegex : undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeClientIdentifierTemplate(raw: unknown): FineractClientIdentifierTemplate {
  if (!raw || typeof raw !== 'object') {
    return { allowedDocumentTypes: [], identityTypeOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const allowedDocumentTypes = Array.isArray(row.allowedDocumentTypes)
    ? row.allowedDocumentTypes
        .filter(
          (item): item is { id: number; name: string } =>
            item != null &&
            typeof item === 'object' &&
            Number.isFinite(Number((item as { id?: unknown }).id)) &&
            typeof (item as { name?: unknown }).name === 'string'
        )
        .map((item) => ({ id: Number(item.id), name: item.name }))
    : [];
  const identityTypeOptions = Array.isArray(row.identityTypeOptions)
    ? row.identityTypeOptions
        .map((item) => normalizeIdentityTypeOption(item))
        .filter((item): item is ClientIdentifierIdentityTypeOption => item !== null)
    : [];
  return { allowedDocumentTypes, identityTypeOptions };
}

export async function getClientIdentifiers(
  clientId: string | number
): Promise<FineractClientIdentifier[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientIdentifier[]>(`/clients/${clientId}/identifiers`);
  const list = Array.isArray(data) ? data : [];

  return Promise.all(
    list.map(async (identifier) => {
      try {
        const documents = await fineract.get<FineractEntityDocument[]>(
          `/client_identifiers/${identifier.id}/documents`
        );
        return {
          ...identifier,
          documents: Array.isArray(documents) ? documents : []
        };
      } catch {
        return { ...identifier, documents: [] };
      }
    })
  );
}

export async function getClientIdentifierTemplate(
  clientId: string | number
): Promise<FineractClientIdentifierTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/clients/${clientId}/identifiers/template`);
  return normalizeClientIdentifierTemplate(raw);
}

export async function createClientIdentifier(
  clientId: string | number,
  input: ClientIdentifierInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(`/clients/${clientId}/identifiers`, input);
}

export async function deleteClientIdentifier(
  clientId: string | number,
  identifierId: number
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/clients/${clientId}/identifiers/${identifierId}`);
}

export async function uploadClientIdentifierDocument(
  identifierId: number,
  file: File,
  name: string
): Promise<{ resourceId: number }> {
  const { urlBase, init } = await buildFineractRequestInit({ method: 'POST' });
  const formData = new FormData();
  formData.append('name', name);
  formData.append('file', file);

  const headers = new Headers(init.headers);
  const res = await fetch(fineractUrl(urlBase, `/client_identifiers/${identifierId}/documents`), {
    ...init,
    headers,
    body: formData
  });

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new FineractHttpError(res.status, body);
  }

  return (await res.json()) as { resourceId: number };
}

export async function fetchClientIdentifierDocumentAttachment(
  identifierId: number,
  documentId: number
): Promise<Response> {
  const { urlBase, init } = await buildFineractRequestInit();
  return fetch(
    fineractUrl(urlBase, `/client_identifiers/${identifierId}/documents/${documentId}/attachment`),
    init
  );
}
