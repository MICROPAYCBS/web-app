'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlClosureDetail, FineractOfficeOption } from '@mifos/api-client';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteGlClosureAction } from '@/actions/gl-closures';
import { GlClosureFormSheet } from '@/components/accounting/gl-closure-form-sheet';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
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

export function GlClosureDetailView({
  closure,
  offices,
  canUpdate,
  canDelete
}: {
  closure: FineractGlClosureDetail;
  offices: FineractOfficeOption[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteGlClosureAction(closure.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/accounting/closing-entries');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/closing-entries" label="Back to closing entries" />
            }
            title={closure.officeName || `Closure #${closure.id}`}
            meta={`Accounting closure as of ${closure.closingDate || '—'}.`}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    disabled={pending}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        <DetailFieldGrid>
          <DetailField label="Office">{closure.officeName || '—'}</DetailField>
          <DetailField label="Closure date">{closure.closingDate || '—'}</DetailField>
          <DetailField label="Closed by">{closure.createdByUsername || '—'}</DetailField>
          <DetailField label="Updated by">{closure.lastUpdatedByUsername || '—'}</DetailField>
          <DetailField label="Updated on">{closure.lastUpdatedDate || '—'}</DetailField>
          <DetailField label="Closure creation date">{closure.createdDate || '—'}</DetailField>
          <DetailField label="Comments">{closure.comments?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailPage>

      {canUpdate ? (
        <GlClosureFormSheet
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          offices={offices}
          closure={closure}
        />
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete accounting closure?</DialogTitle>
            <DialogDescription>
              This removes the closure for {closure.officeName} on {closure.closingDate}. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
