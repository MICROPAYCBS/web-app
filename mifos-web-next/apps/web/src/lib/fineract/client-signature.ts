/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractEntityDocument } from '@mifos/api-client';
import { cache } from 'react';
import { getClientDocuments } from '@/lib/fineract/client-documents';
import { findClientSignatureDocument } from '@/lib/fineract/client-signature-constants';

export { CLIENT_SIGNATURE_DOCUMENT_NAME, findClientSignatureDocument } from '@/lib/fineract/client-signature-constants';

export function clientHasSignatureDocument(
  documents: FineractEntityDocument[]
): boolean {
  return findClientSignatureDocument(documents) !== undefined;
}

export const getClientSignatureInfo = cache(
  async (
    clientId: string | number
  ): Promise<{ hasSignature: boolean; documentId?: number }> => {
    const documents = await getClientDocuments(clientId);
    const signature = findClientSignatureDocument(documents);
    return {
      hasSignature: signature !== undefined,
      documentId: signature?.id
    };
  }
);

/** @deprecated Use getClientSignatureInfo */
export const getClientHasSignature = cache(async (clientId: string | number) => {
  const info = await getClientSignatureInfo(clientId);
  return info.hasSignature;
});
