/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { NextResponse } from 'next/server';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import {
  DOCUMENT_UPLOAD_REJECTED_MESSAGE,
  isAllowedDocumentUpload
} from '@/lib/documents/document-preview';
import { uploadLoanDocument } from '@/lib/fineract/loan-documents';

export async function POST(
  request: Request,
  context: { params: Promise<{ accountId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('loans.documents.create'));
    const { accountId } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    const description = formData.get('description');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }
    if (!isAllowedDocumentUpload(file)) {
      return NextResponse.json({ message: DOCUMENT_UPLOAD_REJECTED_MESSAGE }, { status: 400 });
    }

    const result = await uploadLoanDocument(
      accountId,
      file,
      name.trim(),
      typeof description === 'string' ? description : undefined
    );
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}
