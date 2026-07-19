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
import { uploadClientIdentifierDocument } from '@/lib/fineract/client-identifiers';

export async function POST(
  request: Request,
  context: { params: Promise<{ identifierId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'CREATE_CLIENTIDENTIFIER');
    const { identifierId } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const result = await uploadClientIdentifierDocument(
      Number(identifierId),
      file,
      name.trim()
    );
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}
