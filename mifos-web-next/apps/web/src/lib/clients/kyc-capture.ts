/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass } from '@mifos/api-client';
import { uploadClientSignatureFile } from '@/lib/fineract/upload-client-signature';

export type StagedKycCapture = {
  file: File;
  previewUrl: string;
};

export type CustomerClassKycRequirements = {
  requirePhoto: boolean;
  requireSignature: boolean;
};

export function customerClassKycRequirements(
  customerClass: CustomerClass | undefined
): CustomerClassKycRequirements {
  return {
    requirePhoto: customerClass?.enforceCustPhoto === true,
    requireSignature: customerClass?.enforceCustSignature === true
  };
}

export function customerClassNeedsKycStep(
  customerClass: CustomerClass | undefined
): boolean {
  const { requirePhoto, requireSignature } = customerClassKycRequirements(customerClass);
  return requirePhoto || requireSignature;
}

export function revokeStagedKycCapture(capture: StagedKycCapture | null | undefined): void {
  if (capture?.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(capture.previewUrl);
  }
}

export function stageKycFile(file: File): StagedKycCapture {
  return {
    file,
    previewUrl: URL.createObjectURL(file)
  };
}

export function dataUrlToKycFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(header ?? '')?.[1] ?? 'image/jpeg';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export function stageKycDataUrl(dataUrl: string, filename: string): StagedKycCapture {
  return {
    file: dataUrlToKycFile(dataUrl, filename),
    previewUrl: dataUrl
  };
}

export type PersistStagedKycResult = { ok: true } | { ok: false; message: string };

export async function persistStagedKycCaptures(
  clientId: string,
  captures: {
    photo?: StagedKycCapture | null;
    signature?: StagedKycCapture | null;
  }
): Promise<PersistStagedKycResult> {
  const failures: string[] = [];

  if (captures.photo) {
    const formData = new FormData();
    formData.append('file', captures.photo.file);
    const res = await fetch(`/api/clients/${clientId}/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      failures.push('the photo');
    }
  }

  if (captures.signature) {
    const result = await uploadClientSignatureFile(clientId, captures.signature.file);
    if (!result.ok) {
      failures.push('the signature');
    }
  }

  if (failures.length === 0) {
    return { ok: true };
  }

  const detail =
    failures.length === 1
      ? failures[0]
      : `${failures[0]} and ${failures[1]}`;
  return {
    ok: false,
    message: `Customer was saved, but ${detail} could not be attached. Open the customer to try again.`
  };
}
