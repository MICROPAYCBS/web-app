/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDocument } from '@mifos/api-client';
import { Download, FileText } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const downloadLinkClassName =
  'inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted';

export function formatDocumentSummary(document: FineractEntityDocument): string {
  return document.description?.trim() || document.fileName || 'Customer document';
}

export function ClientDocumentListItem({
  clientId,
  document,
  canDelete,
  onDelete,
  className
}: {
  clientId: string;
  document: FineractEntityDocument;
  canDelete: boolean;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 bg-card px-4 py-3', className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{document.name}</p>
          <p className="text-sm text-muted-foreground">{formatDocumentSummary(document)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href={`/api/clients/${clientId}/documents/${document.id}/attachment`} download className={downloadLinkClassName}>
          <Download className="size-4" />
          Download
        </a>
        {canDelete ? (
          <button
            type="button"
            className="text-sm font-medium text-destructive hover:underline"
            onClick={onDelete}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ClientDocumentGridCard({
  clientId,
  document,
  canDelete,
  onDelete
}: {
  clientId: string;
  document: FineractEntityDocument;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          {document.name}
        </CardTitle>
        <CardDescription>{formatDocumentSummary(document)}</CardDescription>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <a href={`/api/clients/${clientId}/documents/${document.id}/attachment`} download className={downloadLinkClassName}>
            <Download className="size-4" />
            Download
          </a>
          {canDelete ? (
            <button
              type="button"
              className="text-sm font-medium text-destructive hover:underline"
              onClick={onDelete}
            >
              Delete
            </button>
          ) : null}
        </div>
      </CardHeader>
    </Card>
  );
}
