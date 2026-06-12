/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { jsonError } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { fetchBulkImportOutputDocument } from '@/lib/fineract/bulk-import';

export async function GET(
  _request: Request,
  context: { params: Promise<{ importDocumentId: string }> }
) {
  const { session, error } = await requireServerSession();
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'READ_DOCUMENT');
    const { importDocumentId } = await context.params;
    const res = await fetchBulkImportOutputDocument(importDocumentId);
    if (!res.ok) {
      return Response.json({ message: 'Import document not found' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment'
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
