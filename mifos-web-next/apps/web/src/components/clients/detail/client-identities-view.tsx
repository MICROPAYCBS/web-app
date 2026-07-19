'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIdentifier, ClientIdentifierIdentityTypeOption } from '@mifos/api-client';
import { formatActionErrorMessage, type ClientIdentifierInput } from '@mifos/validation';
import { Fingerprint, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createClientIdentifierAction,
  deleteClientIdentifierAction
} from '@/actions/client-identifier';
import { ClientIdentifierListItem } from '@/components/clients/detail/client-identifier-sections';
import { ClientDetailResourceView } from '@/components/clients/detail/client-detail-resource-view';
import { ClientIdentifierFormSheet } from '@/components/clients/shared/client-identifier-form-sheet';
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
  identityTypeOptions = [],
  canCreate,
  canDelete
}: {
  clientId: string;
  identifiers: FineractClientIdentifier[];
  documentTypes: { id: number; name: string }[];
  identityTypeOptions?: ClientIdentifierIdentityTypeOption[];
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
          message: formatActionErrorMessage(result.message, result.fieldErrors),
          fieldErrors: result.fieldErrors
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
    <>
      <ClientDetailResourceView
        description="Official IDs and reference numbers on file."
        toolbar={
          canCreate ? (
            <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add identifier
            </Button>
          ) : undefined
        }
        error={actionError}
        isEmpty={identifiers.length === 0}
        emptyIcon={Fingerprint}
        emptyTitle="No identifiers on file"
        emptyDescription="Add passport, national ID, or other reference numbers for this customer."
        emptyAction={
          canCreate ? (
            <Button type="button" size="sm" disabled={pending} onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add identifier
            </Button>
          ) : undefined
        }
      >
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
      </ClientDetailResourceView>

      <ClientIdentifierFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        documentTypes={documentTypes}
        identityTypeOptions={identityTypeOptions}
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
    </>
  );
}
