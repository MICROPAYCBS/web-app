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
  FineractEntityDocument
} from '@mifos/api-client';
import type { ClientIdentifierInput } from '@mifos/validation';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractRequestInit, fineractUrl } from '@/lib/fineract/fineract-fetch';

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
  return fineract.get<FineractClientIdentifierTemplate>(`/clients/${clientId}/identifiers/template`);
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
