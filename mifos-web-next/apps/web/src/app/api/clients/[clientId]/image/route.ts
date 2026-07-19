/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { NextResponse } from 'next/server';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import {
  deleteClientProfileImage,
  getClientProfileImage,
  uploadClientProfileImageDataUrl,
  uploadClientProfileImageFile
} from '@/lib/fineract/client-image';

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'READ_CLIENT');
    const { clientId } = await context.params;
    const src = await getClientProfileImage(clientId);
    return jsonOk({ src });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'CREATE_CLIENTIMAGE');
    const { clientId } = await context.params;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
      }
      await uploadClientProfileImageFile(clientId, file);
    } else {
      const dataUrl = await request.text();
      if (!dataUrl.trim()) {
        return NextResponse.json({ message: 'Image data is required' }, { status: 400 });
      }
      await uploadClientProfileImageDataUrl(clientId, dataUrl);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'DELETE_CLIENTIMAGE');
    const { clientId } = await context.params;
    await deleteClientProfileImage(clientId);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
