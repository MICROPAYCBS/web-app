/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractEntityDocument } from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractRequestInit, fineractUrl } from '@/lib/fineract/fineract-fetch';

export async function getClientDocuments(
  clientId: string | number
): Promise<FineractEntityDocument[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractEntityDocument[]>(`/clients/${clientId}/documents`);
  return Array.isArray(data) ? data : [];
}

export async function uploadClientDocument(
  clientId: string | number,
  file: File,
  name: string,
  description?: string
): Promise<{ resourceId: number }> {
  const { urlBase, init } = await buildFineractRequestInit({ method: 'POST' });
  const formData = new FormData();
  formData.append('name', name);
  formData.append('file', file);
  if (description?.trim()) {
    formData.append('description', description.trim());
  }

  const headers = new Headers(init.headers);
  const res = await fetch(fineractUrl(urlBase, `/clients/${clientId}/documents`), {
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

export async function deleteClientDocument(
  clientId: string | number,
  documentId: number
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/clients/${clientId}/documents/${documentId}`);
}

export async function fetchClientDocumentAttachment(
  clientId: string | number,
  documentId: number
): Promise<Response> {
  const { urlBase, init } = await buildFineractRequestInit();
  return fetch(
    fineractUrl(urlBase, `/clients/${clientId}/documents/${documentId}/attachment`),
    init
  );
}
