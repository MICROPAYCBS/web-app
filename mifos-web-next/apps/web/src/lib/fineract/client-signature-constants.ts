/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDocument } from '@mifos/api-client';

/** Document name Fineract uses for the client signature attachment (legacy web-app). */
export const CLIENT_SIGNATURE_DOCUMENT_NAME = 'clientSignature';

export function findClientSignatureDocument(
  documents: FineractEntityDocument[]
): FineractEntityDocument | undefined {
  return documents.find(
    (document) => document.name?.trim() === CLIENT_SIGNATURE_DOCUMENT_NAME
  );
}
