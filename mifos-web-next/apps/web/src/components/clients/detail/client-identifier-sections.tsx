/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIdentifier, FineractEntityDocument } from '@mifos/api-client';
import { FileText } from 'lucide-react';
import { DocumentAttachmentActions } from '@/components/clients/shared/document-attachment-actions';
import { Badge } from '@/components/ui/badge';
import { formatFineractDateValue, todayIsoDate } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

export function identifierStatusLabel(status: string): string {
  return status.includes('active') ? 'Active' : 'Inactive';
}

export function formatIdentifierSummary(identifier: FineractClientIdentifier): string {
  const parts = [identifier.documentKey, identifier.description].filter(Boolean);
  return parts.join(' · ') || identifier.documentType.name;
}

function formatIdentifierDateLine(identifier: FineractClientIdentifier): string | null {
  const issued = identifier.issuanceDate
    ? formatFineractDateValue(identifier.issuanceDate)
    : undefined;
  const expires = identifier.expiryDate
    ? formatFineractDateValue(identifier.expiryDate)
    : undefined;
  if (!issued && !expires) {
    return null;
  }
  const parts: string[] = [];
  if (issued) {
    parts.push(`Issued on ${issued}`);
  }
  if (expires) {
    parts.push(`Expires on ${expires}`);
  }
  return parts.join(' · ');
}

export function isIdentifierExpired(identifier: FineractClientIdentifier): boolean {
  return Boolean(identifier.expiryDate && identifier.expiryDate < todayIsoDate());
}

export function ClientIdentifierListItem({
  identifier,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  className
}: {
  identifier: FineractClientIdentifier;
  canUpdate?: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const active = identifierStatusLabel(identifier.status) === 'Active';
  const dateLine = formatIdentifierDateLine(identifier);
  const expired = isIdentifierExpired(identifier);

  return (
    <div className={cn('space-y-3 bg-card px-4 py-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{identifier.documentType.name}</p>
            <Badge variant={active ? 'default' : 'secondary'}>
              {identifierStatusLabel(identifier.status)}
            </Badge>
            {expired ? (
              <span className="text-xs text-muted-foreground">Expired</span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{formatIdentifierSummary(identifier)}</p>
          {dateLine ? (
            <p className="text-sm text-muted-foreground">{dateLine}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-3">
          {canUpdate && onEdit ? (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={onEdit}
            >
              Edit
            </button>
          ) : null}
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
      <IdentifierDocumentList identifierId={identifier.id} documents={identifier.documents ?? []} />
    </div>
  );
}

function IdentifierDocumentList({
  identifierId,
  documents
}: {
  identifierId: number;
  documents: FineractEntityDocument[];
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No supporting documents</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li
          key={document.id}
          className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{document.name}</p>
              {document.fileName ? (
                <p className="truncate text-xs text-muted-foreground">{document.fileName}</p>
              ) : null}
            </div>
          </div>
          <DocumentAttachmentActions
            title={document.name}
            fileName={document.fileName}
            attachmentUrl={`/api/client-identifiers/${identifierId}/documents/${document.id}/attachment`}
          />
        </li>
      ))}
    </ul>
  );
}
