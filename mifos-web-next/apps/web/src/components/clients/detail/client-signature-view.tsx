'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ClientSignatureDeleteDialog,
  ClientSignatureUploadDialog
} from '@/components/clients/detail/client-signature-dialogs';
import { ClientSignatureDrawDialog } from '@/components/clients/detail/client-signature-draw-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type ChainedDialog = 'upload' | 'draw' | 'delete';

function ClientSignatureViewDialog({
  clientId,
  open,
  onOpenChange,
  signatureDocumentId,
  canCreateImage,
  canDeleteImage,
  onUpload,
  onDraw,
  onDelete
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatureDocumentId?: number;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  onUpload: () => void;
  onDraw: () => void;
  onDelete: () => void;
}) {
  const hasSignature = signatureDocumentId !== undefined;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!hasSignature || signatureDocumentId === undefined) {
      setImageSrc(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadSignature() {
      setLoading(true);
      setLoadError(null);
      setImageSrc(null);

      const res = await fetch(
        `/api/clients/${clientId}/documents/${signatureDocumentId}/attachment`
      );
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setLoadError(body?.message ?? 'Could not load signature.');
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      if (cancelled) {
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setImageSrc(objectUrl);
      setLoading(false);
    }

    void loadSignature();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, clientId, hasSignature, signatureDocumentId]);

  useEffect(() => {
    if (open) {
      return;
    }
    setImageSrc((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setLoadError(null);
    setLoading(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>View signature</DialogTitle>
          {hasSignature ? (
            <DialogDescription>Signature on file for this customer.</DialogDescription>
          ) : (
            <DialogDescription>No signature has been saved yet.</DialogDescription>
          )}
        </DialogHeader>

        {hasSignature ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-md border border-border bg-muted/30 p-4">
            {loading ? (
              <Skeleton className="h-32 w-full max-w-sm" />
            ) : loadError ? (
              <p className="text-sm text-destructive" role="alert">
                {loadError}
              </p>
            ) : imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob URL from BFF attachment
              <img
                src={imageSrc}
                alt="Customer signature"
                className="max-h-48 w-full max-w-sm object-contain"
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No signature on file for this customer.
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasSignature && canDeleteImage ? (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
          {!hasSignature && canCreateImage ? (
            <>
              <Button type="button" onClick={onUpload}>
                Upload
              </Button>
              <Button type="button" onClick={onDraw}>
                Draw
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientSignatureView({
  clientId,
  hasSignature,
  signatureDocumentId,
  canCreateImage,
  canDeleteImage
}: {
  clientId: string;
  hasSignature: boolean;
  signatureDocumentId?: number;
  canCreateImage: boolean;
  canDeleteImage: boolean;
}) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [chainedDialog, setChainedDialog] = useState<ChainedDialog | null>(null);

  function refreshClient() {
    router.refresh();
  }

  function openChained(dialog: ChainedDialog) {
    setViewOpen(false);
    setChainedDialog(dialog);
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-sm font-normal"
        onClick={() => setViewOpen(true)}
      >
        View signature
      </Button>

      <ClientSignatureViewDialog
        clientId={clientId}
        open={viewOpen}
        onOpenChange={setViewOpen}
        signatureDocumentId={hasSignature ? signatureDocumentId : undefined}
        canCreateImage={canCreateImage}
        canDeleteImage={canDeleteImage}
        onUpload={() => openChained('upload')}
        onDraw={() => openChained('draw')}
        onDelete={() => openChained('delete')}
      />

      <ClientSignatureUploadDialog
        clientId={clientId}
        open={chainedDialog === 'upload'}
        onOpenChange={(open) => {
          if (!open) {
            setChainedDialog(null);
          }
        }}
        onSuccess={() => {
          refreshClient();
        }}
      />

      <ClientSignatureDrawDialog
        clientId={clientId}
        open={chainedDialog === 'draw'}
        onOpenChange={(open) => {
          if (!open) {
            setChainedDialog(null);
          }
        }}
        onSuccess={() => {
          refreshClient();
        }}
      />

      {signatureDocumentId !== undefined ? (
        <ClientSignatureDeleteDialog
          clientId={clientId}
          documentId={signatureDocumentId}
          open={chainedDialog === 'delete'}
          onOpenChange={(open) => {
            if (!open) {
              setChainedDialog(null);
            }
          }}
          onSuccess={() => {
            refreshClient();
          }}
        />
      ) : null}
    </>
  );
}
