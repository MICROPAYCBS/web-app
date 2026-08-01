'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Download, Eye } from 'lucide-react';
import { useState } from 'react';
import {
  DocumentPreviewDialog,
  type DocumentPreviewTarget
} from '@/components/clients/shared/document-preview-dialog';
import {
  shouldOfferDocumentPreview,
  withDocumentDisposition
} from '@/lib/documents/document-preview';
import { cn } from '@/lib/utils';

const actionClassName =
  'inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted';

export function DocumentAttachmentActions({
  title,
  fileName,
  attachmentUrl,
  className
}: {
  title: string;
  fileName?: string;
  attachmentUrl: string;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const canPreview = shouldOfferDocumentPreview(fileName);
  const downloadHref = withDocumentDisposition(attachmentUrl, 'attachment');
  const previewTarget: DocumentPreviewTarget = {
    title,
    fileName,
    attachmentUrl
  };

  return (
    <div className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}>
      {canPreview ? (
        <button type="button" className={actionClassName} onClick={() => setPreviewOpen(true)}>
          <Eye className="size-4" />
          View
        </button>
      ) : (
        <>
          <a
            href={downloadHref}
            download
            className={actionClassName}
            title="This file type cannot be previewed in the app"
          >
            <Download className="size-4" />
            Download
          </a>
          <span className="max-w-[12rem] text-xs text-muted-foreground sm:max-w-none">
            Preview unavailable — download only
          </span>
        </>
      )}
      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewOpen ? previewTarget : null}
      />
    </div>
  );
}
