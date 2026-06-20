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
import { deleteClientDocumentAction } from '@/actions/client-document';
import {
  ClientDocumentGridCard,
  ClientDocumentListItem
} from '@/components/clients/detail/client-document-sections';
import { ClientDocumentFormSheet } from '@/components/clients/shared/client-document-form-sheet';
import {
  CollectionViewLayout,
  CollectionViewToggle,
  EmptyState,
  useCollectionViewMode
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const VIEW_MODE_STORAGE_KEY = 'mifos.client-documents.view-mode';

export function ClientDocumentsView({
  clientId,
  documents,
  canCreate,
  canDelete
}: {
  clientId: string;
  documents: FineractEntityDocument[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FineractEntityDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { mode, setMode } = useCollectionViewMode(VIEW_MODE_STORAGE_KEY, 'list');

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

      const res = await fetch(`/api/clients/${clientId}/documents`, {
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
      const result = await deleteClientDocumentAction(clientId, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  function renderDocument(document: FineractEntityDocument) {
    const common = {
      clientId,
      document,
      canDelete,
      onDelete: () => setDeleteTarget(document)
    };

    if (mode === 'grid') {
      return <ClientDocumentGridCard key={document.id} {...common} />;
    }

    return <ClientDocumentListItem key={document.id} {...common} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Files attached to this customer record.</p>
        <div className="flex flex-wrap items-center gap-2">
          {documents.length > 0 ? (
            <CollectionViewToggle mode={mode} onModeChange={setMode} disabled={pending} />
          ) : null}
          {canCreate ? (
            <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 size-4" />
              Upload document
            </Button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents on file"
          description="Upload contracts, forms, or other files for this customer."
          action={
            canCreate ? (
              <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
                <Plus className="mr-2 size-4" />
                Upload document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <CollectionViewLayout mode={mode}>
          {documents.map((document) => renderDocument(document))}
        </CollectionViewLayout>
      )}

      <ClientDocumentFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleUpload}
        submitLoading={false}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.name}? This cannot be undone.`
                : null}
            </DialogDescription>
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
    </div>
  );
}
