/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { FineractHttpError, type FineractCommandProcessingResult } from '@mifos/api-client';
import { buildFineractRequestInit, fineractUrl } from './fineract-fetch';

export function clientHasProfileImage(client: {
  imageId?: number | null;
  imagePresent?: boolean | null;
}): boolean {
  return client.imagePresent === true || client.imageId != null;
}

export async function getClientProfileImage(clientId: string | number): Promise<string | null> {
  const { urlBase, init } = await buildFineractRequestInit();
  const url = new URL(fineractUrl(urlBase, `/clients/${clientId}/images`));
  url.searchParams.set('maxHeight', '150');

  const res = await fetch(url, init);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new FineractHttpError(res.status, body);
  }
  const text = await res.text();
  return text?.trim() ? text : null;
}

export async function uploadClientProfileImageFile(
  clientId: string | number,
  file: File
): Promise<FineractCommandProcessingResult> {
  const { urlBase, init } = await buildFineractRequestInit({ method: 'POST' });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', 'file');

  const headers = new Headers(init.headers);
  const res = await fetch(fineractUrl(urlBase, `/clients/${clientId}/images`), {
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

  try {
    return (await res.json()) as FineractCommandProcessingResult;
  } catch {
    return {};
  }
}

export async function uploadClientProfileImageDataUrl(
  clientId: string | number,
  dataUrl: string
): Promise<FineractCommandProcessingResult> {
  const { urlBase, init } = await buildFineractRequestInit({
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: dataUrl
  });

  const res = await fetch(fineractUrl(urlBase, `/clients/${clientId}/images`), init);
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new FineractHttpError(res.status, body);
  }

  try {
    return (await res.json()) as FineractCommandProcessingResult;
  } catch {
    return {};
  }
}

export async function deleteClientProfileImage(clientId: string | number): Promise<FineractCommandProcessingResult> {
  const { urlBase, init } = await buildFineractRequestInit({ method: 'DELETE' });
  const res = await fetch(fineractUrl(urlBase, `/clients/${clientId}/images`), init);
  if (res.status === 404) {
    return {};
  }
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new FineractHttpError(res.status, body);
  }

  try {
    return (await res.json()) as FineractCommandProcessingResult;
  } catch {
    return {};
  }
}
