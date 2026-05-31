'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CaptureClientImageDialog } from '@/components/clients/detail/capture-client-image-dialog';
import { UploadClientImageDialog } from '@/components/clients/detail/upload-client-image-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { clientInitials } from '@/lib/fineract/clients-display';

export function ClientProfileAvatar({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
}) {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState(initialImageSrc);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  async function reloadImage() {
    const res = await fetch(`/api/clients/${client.id}/image?v=${Date.now()}`);
    if (!res.ok) {
      setImageSrc(null);
      return;
    }
    const data = (await res.json()) as { src: string | null };
    setImageSrc(data.src);
    setImageVersion((v) => v + 1);
    router.refresh();
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/clients/${client.id}/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Failed to upload image');
    }
    await reloadImage();
  }

  async function uploadDataUrl(dataUrl: string) {
    const res = await fetch(`/api/clients/${client.id}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: dataUrl
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Failed to save photo');
    }
    await reloadImage();
  }

  async function deleteImage() {
    const res = await fetch(`/api/clients/${client.id}/image`, { method: 'DELETE' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Failed to delete image');
    }
    setImageSrc(null);
    setImageVersion((v) => v + 1);
    router.refresh();
  }

  const initials = clientInitials(client);
  const showImage = Boolean(imageSrc);

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <Avatar className="size-24 text-lg">
        {showImage ? <AvatarImage key={imageVersion} src={imageSrc ?? undefined} alt="" /> : null}
        <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
      </Avatar>

      {canCreateImage || (canDeleteImage && showImage) ? (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
          {canCreateImage ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Upload photo"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="size-4" />
                <span className="sr-only">Upload photo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Capture with camera"
                onClick={() => setCaptureOpen(true)}
              >
                <Camera className="size-4" />
                <span className="sr-only">Capture with camera</span>
              </Button>
            </>
          ) : null}
          {canDeleteImage && showImage ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Delete photo"
              onClick={() => void deleteImage()}
            >
              <Trash2 className="size-4 text-destructive" />
              <span className="sr-only">Delete photo</span>
            </Button>
          ) : null}
        </div>
      ) : null}

      <UploadClientImageDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={uploadFile}
      />
      <CaptureClientImageDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onCapture={uploadDataUrl}
      />
    </div>
  );
}
