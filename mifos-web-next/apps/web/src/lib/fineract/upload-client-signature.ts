/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  actionSuccessFromFineractCommand,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { CLIENT_SIGNATURE_DOCUMENT_NAME } from '@/lib/fineract/client-signature-constants';

export type UploadClientSignatureResult =
  | ({ ok: true } & FineractCommandActionMeta)
  | { ok: false; message: string };

export async function uploadClientSignatureFile(
  clientId: string,
  file: File
): Promise<UploadClientSignatureResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', CLIENT_SIGNATURE_DOCUMENT_NAME);
  formData.append('description', 'Customer signature');

  const res = await fetch(`/api/clients/${clientId}/documents`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, message: body?.message ?? 'Upload failed.' };
  }

  const body = await res.json().catch(() => ({}));
  return actionSuccessFromFineractCommand(body, {});
}
