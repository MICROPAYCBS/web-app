'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDocument } from '@mifos/api-client';
import { formatActionErrorMessage, type ClientDocumentMetadataInput } from '@mifos/validation';
import { FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteLoanDocumentAction } from '@/actions/loan-document';
import {
  ClientDocumentSections,
  formatDocumentSummary
} from '@/components/clients/detail/client-document-sections';
import type { LoanAccountDocumentsContext } from '@/components/clients/loan-account/loan-account-related-context';
import { ClientDocumentFormSheet } from '@/components/clients/shared/client-document-form-sheet';
import { DocumentAttachmentActions } from '@/components/clients/shared/document-attachment-actions';
import { DetailSection, EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function LoanAccountDocumentsSection({
  clientId,
  accountId,
  context
}: {
  clientId: string;
  accountId: number;
  context: LoanAccountDocumentsContext;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FineractEntityDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleUpload(input: ClientDocumentMetadataInput, file: File) {
    return (async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', input.name.trim());
      if (input.description?.trim()) {
        formData.append('description', input.description.trim());
      }

      const res = await fetch(`/api/loans/${accountId}/documents`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return { ok: false as const, message: body?.message ?? 'Upload failed.' };
      }
      refresh();
      return { ok: true as const };
    })();
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteLoanDocumentAction(clientId, accountId, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  return (
    <DetailSection
      title="Documents"
      actions={
        context.canCreate ? (
          <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 size-4" />
            Upload document
          </Button>
        ) : null
      }
    >
      <p className="text-sm text-muted-foreground">Files attached to this loan account.</p>

      {actionError ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {context.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload agreements, collateral scans, and other files for this loan."
          />
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {context.items.map((document) => (
            <div key={document.id} className="flex items-start justify-between gap-3 bg-card px-4 py-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDocumentSummary(document)}</p>
                  <ClientDocumentSections document={document} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                <DocumentAttachmentActions
                  title={document.name}
                  fileName={document.fileName}
                  attachmentUrl={`/api/loans/${accountId}/documents/${document.id}/attachment`}
                />
                {context.canDelete ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-destructive hover:underline"
                    onClick={() => setDeleteTarget(document)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientDocumentFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleUpload}
        submitLoading={pending}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>This file will be permanently removed from the loan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}
