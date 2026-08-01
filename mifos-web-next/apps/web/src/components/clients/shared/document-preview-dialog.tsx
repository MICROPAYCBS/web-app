'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
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
import {
  documentPreviewKind,
  withDocumentDisposition,
  type DocumentPreviewKind
} from '@/lib/documents/document-preview';

export type DocumentPreviewTarget = {
  title: string;
  fileName?: string;
  /** Authenticated BFF attachment URL without disposition query. */
  attachmentUrl: string;
};

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentPreviewTarget | null;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<DocumentPreviewKind>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      return;
    }

    const target = document;
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setKind(null);

      const res = await fetch(withDocumentDisposition(target.attachmentUrl, 'inline'));
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? 'Could not load this document.');
        setLoading(false);
        return;
      }

      const contentType = res.headers.get('content-type');
      const previewKind = documentPreviewKind({
        contentType,
        fileName: target.fileName
      });
      if (!previewKind) {
        setError('This file type cannot be previewed in the app.');
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      if (cancelled) {
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      setKind(previewKind);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, document]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle className="truncate pr-8">{document?.title ?? 'Document'}</DialogTitle>
          {document?.fileName ? (
            <DialogDescription className="truncate">{document.fileName}</DialogDescription>
          ) : (
            <DialogDescription>View this document in the app.</DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-[50vh] flex-1 overflow-auto bg-muted/30 px-4 py-4">
          {loading ? <Skeleton className="h-[50vh] w-full" /> : null}
          {!loading && error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error && blobUrl && kind === 'pdf' ? (
            <iframe
              title={document?.title ?? 'PDF document'}
              src={blobUrl}
              className="h-[min(70vh,720px)] w-full rounded-md border border-border bg-background"
            />
          ) : null}
          {!loading && !error && blobUrl && kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL from authenticated fetch
            <img
              src={blobUrl}
              alt={document?.title ?? 'Document image'}
              className="mx-auto max-h-[min(70vh,720px)] max-w-full object-contain"
            />
          ) : null}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
