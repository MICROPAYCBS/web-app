'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIdentifier } from '@mifos/api-client';
import { formatActionErrorMessage, type ClientIdentifierInput } from '@mifos/validation';
import { Fingerprint, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createClientIdentifierAction,
  deleteClientIdentifierAction
} from '@/actions/client-identifier';
import { ClientIdentifierListItem } from '@/components/clients/detail/client-identifier-sections';
import { ClientIdentifierFormSheet } from '@/components/clients/shared/client-identifier-form-sheet';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function ClientIdentitiesView({
  clientId,
  identifiers,
  documentTypes,
  canCreate,
  canDelete
}: {
  clientId: string;
  identifiers: FineractClientIdentifier[];
  documentTypes: { id: number; name: string }[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FineractClientIdentifier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleSave(
    input: ClientIdentifierInput,
    file: File | null,
    fileName: string
  ) {
    return (async () => {
      const result = await createClientIdentifierAction(clientId, input);
      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors)
        };
      }

      if (file && result.resourceId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', fileName || file.name);
        const uploadRes = await fetch(`/api/client-identifiers/${result.resourceId}/documents`, {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          const body = (await uploadRes.json().catch(() => null)) as { message?: string } | null;
          refresh();
          return {
            ok: false as const,
            message: body?.message ?? 'Identifier saved, but the document upload failed.'
          };
        }
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
      const result = await deleteClientIdentifierAction(clientId, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Official IDs and reference numbers on file.</p>
        {canCreate ? (
          <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add identifier
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {identifiers.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title="No identifiers on file"
          description="Add passport, national ID, or other reference numbers for this client."
          action={
            canCreate ? (
              <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add identifier
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {identifiers.map((identifier) => (
            <ClientIdentifierListItem
              key={identifier.id}
              identifier={identifier}
              canDelete={canDelete}
              onDelete={() => setDeleteTarget(identifier)}
            />
          ))}
        </div>
      )}

      <ClientIdentifierFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        documentTypes={documentTypes}
        onSave={handleSave}
        submitLoading={false}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete identifier</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.documentType.name} (${deleteTarget.documentKey})? This cannot be undone.`
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
