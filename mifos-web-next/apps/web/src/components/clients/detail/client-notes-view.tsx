'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientNote } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { NotebookPen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createClientNoteAction,
  deleteClientNoteAction,
  updateClientNoteAction
} from '@/actions/client-note';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatFineractDateArray } from '@/lib/fineract/dates';

function formatNoteDate(note: FineractClientNote): string | undefined {
  if (Array.isArray(note.createdOn)) {
    return formatFineractDateArray(note.createdOn) ?? undefined;
  }
  if (typeof note.createdOn === 'string' && note.createdOn.trim()) {
    return note.createdOn;
  }
  return undefined;
}

export function ClientNotesView({
  clientId,
  notes,
  canWrite
}: {
  clientId: string;
  notes: FineractClientNote[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState('');
  const [editTarget, setEditTarget] = useState<FineractClientNote | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FineractClientNote | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleAdd() {
    if (!draft.trim()) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await createClientNoteAction(clientId, { note: draft.trim() });
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDraft('');
      refresh();
    });
  }

  function handleEditSave() {
    if (!editTarget || !editDraft.trim()) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await updateClientNoteAction(clientId, editTarget.id, {
        note: editDraft.trim()
      });
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setEditTarget(null);
      refresh();
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientNoteAction(clientId, deleteTarget.id);
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
      <p className="text-sm text-muted-foreground">Internal notes about this client.</p>

      {canWrite ? (
        <div className="space-y-2">
          <Label htmlFor="client-note-draft">Add a note</Label>
          <Textarea
            id="client-note-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a note…"
            rows={3}
            disabled={pending}
          />
          <Button type="button" size="sm" disabled={pending || !draft.trim()} onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add note
          </Button>
        </div>
      ) : null}

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Notes help your team track conversations, follow-ups, and context for this client."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const createdOn = formatNoteDate(note);
            return (
              <Card key={note.id} size="sm">
                <CardContent className="pt-0">
                  <p className="whitespace-pre-wrap text-sm">{note.note}</p>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground">
                    {note.createdByUsername ? `Created by ${note.createdByUsername}` : 'Note'}
                    {createdOn ? ` · ${createdOn}` : ''}
                  </div>
                  {canWrite ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          setEditTarget(note);
                          setEditDraft(note.note);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-destructive hover:underline"
                        onClick={() => setDeleteTarget(note)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>Update the note text for this client.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editDraft}
            onChange={(event) => setEditDraft(event.target.value)}
            rows={4}
            disabled={pending}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !editDraft.trim()}
              onClick={handleEditSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>This note will be permanently removed.</DialogDescription>
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
