/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDocument } from '@mifos/api-client';
import { FileText } from 'lucide-react';
import type { CollectionDetailMode } from '@/components/composites';
import { CollectionItemFieldDetails, DetailField, DetailFieldGrid, TextValue } from '@/components/composites';
import { DocumentAttachmentActions } from '@/components/clients/shared/document-attachment-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function formatDocumentSummary(document: FineractEntityDocument): string {
  return document.description?.trim() || document.fileName || 'Customer document';
}

export function ClientDocumentSections({ document }: { document: FineractEntityDocument }) {
  return (
    <DetailFieldGrid>
      <DetailField label="Name">
        <TextValue value={document.name} />
      </DetailField>
      <DetailField label="File name">
        <TextValue value={document.fileName} />
      </DetailField>
      <DetailField label="Description">
        <TextValue value={document.description} />
      </DetailField>
    </DetailFieldGrid>
  );
}

function documentAttachmentUrl(clientId: string, documentId: number): string {
  return `/api/clients/${clientId}/documents/${documentId}/attachment`;
}

export function ClientDocumentListItem({
  clientId,
  document,
  detailMode,
  canDelete,
  onDelete,
  className
}: {
  clientId: string;
  document: FineractEntityDocument;
  detailMode?: CollectionDetailMode;
  canDelete: boolean;
  onDelete: () => void;
  className?: string;
}) {
  const summary = formatDocumentSummary(document);
  const body =
    detailMode ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        <ClientDocumentSections document={document} />
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <div className={cn('flex items-start justify-between gap-3 bg-card px-4 py-3', className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{document.name}</p>
          {body}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <DocumentAttachmentActions
          title={document.name}
          fileName={document.fileName}
          attachmentUrl={documentAttachmentUrl(clientId, document.id)}
        />
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
  detailMode,
  canDelete,
  onDelete
}: {
  clientId: string;
  document: FineractEntityDocument;
  detailMode?: CollectionDetailMode;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const summary = formatDocumentSummary(document);
  const body =
    detailMode ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        <ClientDocumentSections document={document} />
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          {document.name}
        </CardTitle>
        {detailMode ? null : <CardDescription>{summary}</CardDescription>}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <DocumentAttachmentActions
            title={document.name}
            fileName={document.fileName}
            attachmentUrl={documentAttachmentUrl(clientId, document.id)}
          />
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
      {detailMode ? <CardContent>{body}</CardContent> : null}
    </Card>
  );
}
