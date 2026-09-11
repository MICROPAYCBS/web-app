'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useId, useState, useTransition } from 'react';
import { deleteClientSignatureAction } from '@/actions/client-signature';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { uploadClientSignatureFile } from '@/lib/fineract/upload-client-signature';

export function ClientSignatureUploadDialog({
  clientId,
  open,
  onOpenChange,
  onSuccess,
  onCapture
}: {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When set, return the file instead of uploading. */
  onCapture?: (file: File) => void | Promise<void>;
}) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (!next) {
      setFile(null);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleUpload() {
    if (!file) {
      setError('Choose an image file for the signature.');
      return;
    }
    setError(null);
    startTransition(async () => {
      if (onCapture) {
        await onCapture(file);
        handleOpenChange(false);
        return;
      }
      if (!clientId) {
        setError('Choose an image file for the signature.');
        return;
      }
      const result = await uploadClientSignatureFile(clientId, file);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Signature uploaded.',
        pending: 'Signature upload sent for approval.'
      });
      handleOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Upload signature</DialogTitle>
          <DialogDescription>
            Attach a signature image for this customer. It is stored as a customer document.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={inputId}>Signature image</Label>
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            disabled={pending}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending || !file} onClick={handleUpload}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientSignatureDeleteDialog({
  clientId,
  documentId,
  open,
  onOpenChange,
  onSuccess
}: {
  clientId: string;
  documentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (!next) {
      setError(null);
    }
    onOpenChange(next);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteClientSignatureAction(clientId, documentId);
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Signature deleted.',
        pending: 'Signature deletion sent for approval.'
      });
      handleOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Delete signature?</DialogTitle>
          <DialogDescription>
            This removes the customer signature document. You can upload a new signature later.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
