'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import { Camera, PenLine, PenTool, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { CaptureClientImageDialog } from '@/components/clients/detail/capture-client-image-dialog';
import { ClientSignatureDrawDialog } from '@/components/clients/detail/client-signature-draw-dialog';
import { ClientSignatureUploadDialog } from '@/components/clients/detail/client-signature-dialogs';
import { UploadClientImageDialog } from '@/components/clients/detail/upload-client-image-dialog';
import { Button } from '@/components/ui/button';
import {
  customerClassKycRequirements,
  revokeStagedKycCapture,
  stageKycDataUrl,
  stageKycFile,
  type StagedKycCapture
} from '@/lib/clients/kyc-capture';
import type { CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

function CapturePreview({
  label,
  capture,
  alt
}: {
  label: string;
  capture: StagedKycCapture | null | undefined;
  alt: string;
}) {
  if (!capture) {
    return (
      <div className="flex aspect-[4/3] max-w-xs items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground">
        {label} not captured yet
      </div>
    );
  }

  return (
    <div className="max-w-xs overflow-hidden rounded-lg border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- staged blob / data URL preview */}
      <img src={capture.previewUrl} alt={alt} className="aspect-[4/3] w-full object-contain" />
    </div>
  );
}

export function KycCaptureStep({
  template,
  draft,
  errors,
  canCreateImage = true,
  canCreateDocument = true,
  onPhotoChange,
  onSignatureChange
}: {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  errors: StepErrors;
  canCreateImage?: boolean;
  canCreateDocument?: boolean;
  onPhotoChange: (capture: StagedKycCapture | null) => void;
  onSignatureChange: (capture: StagedKycCapture | null) => void;
}) {
  const customerClass = template.customerClassOptions?.find(
    (option) => option.id === draft.general.customerClassId
  );
  const { requirePhoto, requireSignature } = customerClassKycRequirements(customerClass);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [capturePhotoOpen, setCapturePhotoOpen] = useState(false);
  const [uploadSignatureOpen, setUploadSignatureOpen] = useState(false);
  const [drawSignatureOpen, setDrawSignatureOpen] = useState(false);

  function replacePhoto(next: StagedKycCapture | null) {
    revokeStagedKycCapture(draft.kycPhoto);
    onPhotoChange(next);
  }

  function replaceSignature(next: StagedKycCapture | null) {
    revokeStagedKycCapture(draft.kycSignature);
    onSignatureChange(next);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        This customer class requires the captures below before the customer can be saved.
      </p>

      {requirePhoto ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Customer photo</h2>
          <CapturePreview label="Photo" capture={draft.kycPhoto} alt="Staged customer photo" />
          {!canCreateImage ? (
            <p className="text-sm text-destructive" role="alert">
              Your role cannot save a customer photo. Ask an administrator for the required
              permission.
            </p>
          ) : errors.kycPhoto ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.kycPhoto}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setCapturePhotoOpen(true)}>
              <Camera className="size-4" aria-hidden />
              Capture
            </Button>
            <Button type="button" variant="outline" onClick={() => setUploadPhotoOpen(true)}>
              <Upload className="size-4" aria-hidden />
              Upload
            </Button>
            {draft.kycPhoto ? (
              <Button type="button" variant="ghost" onClick={() => replacePhoto(null)}>
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {requireSignature ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Signature</h2>
          <CapturePreview
            label="Signature"
            capture={draft.kycSignature}
            alt="Staged customer signature"
          />
          {!canCreateDocument ? (
            <p className="text-sm text-destructive" role="alert">
              Your role cannot save a customer signature. Ask an administrator for the required
              permission.
            </p>
          ) : errors.kycSignature ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.kycSignature}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawSignatureOpen(true)}>
              <PenTool className="size-4" aria-hidden />
              Draw
            </Button>
            <Button type="button" variant="outline" onClick={() => setUploadSignatureOpen(true)}>
              <PenLine className="size-4" aria-hidden />
              Upload
            </Button>
            {draft.kycSignature ? (
              <Button type="button" variant="ghost" onClick={() => replaceSignature(null)}>
                <Trash2 className="size-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <CaptureClientImageDialog
        open={capturePhotoOpen}
        onOpenChange={setCapturePhotoOpen}
        onCapture={async (dataUrl) => {
          replacePhoto(stageKycDataUrl(dataUrl, 'customer-photo.jpg'));
        }}
      />
      <UploadClientImageDialog
        open={uploadPhotoOpen}
        onOpenChange={setUploadPhotoOpen}
        onUpload={async (file) => {
          replacePhoto(stageKycFile(file));
        }}
      />
      <ClientSignatureDrawDialog
        open={drawSignatureOpen}
        onOpenChange={setDrawSignatureOpen}
        onCapture={async (file) => {
          replaceSignature(stageKycFile(file));
        }}
      />
      <ClientSignatureUploadDialog
        open={uploadSignatureOpen}
        onOpenChange={setUploadSignatureOpen}
        onCapture={async (file) => {
          replaceSignature(stageKycFile(file));
        }}
      />
    </div>
  );
}
