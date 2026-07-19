/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { jsonError } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { fetchClientDocumentAttachment } from '@/lib/fineract/client-documents';

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string; documentId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'READ_DOCUMENT');
    const { clientId, documentId } = await context.params;
    const res = await fetchClientDocumentAttachment(clientId, Number(documentId));
    if (!res.ok) {
      return jsonError(new Error('Document not found'));
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
