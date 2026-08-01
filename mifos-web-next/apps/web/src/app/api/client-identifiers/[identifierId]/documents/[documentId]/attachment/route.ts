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
import {
  buildDocumentContentDisposition,
  parseDocumentDispositionParam
} from '@/lib/documents/document-preview';
import { fetchClientIdentifierDocumentAttachment } from '@/lib/fineract/client-identifiers';

export async function GET(
  request: Request,
  context: { params: Promise<{ identifierId: string; documentId: string }> }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'READ_CLIENTIDENTIFIER');
    const { identifierId, documentId } = await context.params;
    const disposition = parseDocumentDispositionParam(
      new URL(request.url).searchParams.get('disposition')
    );
    const res = await fetchClientIdentifierDocumentAttachment(
      Number(identifierId),
      Number(documentId)
    );
    if (!res.ok) {
      return jsonError(new Error('Document not found'));
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': buildDocumentContentDisposition({
          disposition,
          upstreamDisposition: res.headers.get('content-disposition')
        })
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
