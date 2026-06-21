'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientIdentifierInput } from '@mifos/validation';
import { Plus, IdCard } from 'lucide-react';
import { useState } from 'react';
import { ClientIdentifierFormSheet } from '@/components/clients/shared/client-identifier-form-sheet';
import { DraftCollectionView } from '@/components/clients/shared/draft-collection-view';
import type { CreateClientDraft } from '../types';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const VIEW_MODE_STORAGE_KEY = 'mifos.create-client.identifiers.view-mode';

function documentTypeLabel(
  documentTypes: { id: number; name: string }[],
  documentTypeId: number
): string {
  return documentTypes.find((type) => type.id === documentTypeId)?.name ?? 'Identifier';
}

function identifierInputSummary(identifier: ClientIdentifierInput): string {
  const parts = [identifier.documentKey, identifier.description].filter(Boolean);
  return parts.join(' · ') || 'Identification document';
}

export function IdentifiersStep({
  documentTypes,
  draft,
  onIdentifiersChange
}: {
  documentTypes: { id: number; name: string }[];
  draft: CreateClientDraft;
  onIdentifiersChange: (identifiers: ClientIdentifierInput[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const identifiers = draft.clientIdentifiers;

  function openAdd() {
    setEditIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setEditIndex(index);
    setDialogOpen(true);
  }

  function remove(index: number) {
    onIdentifiersChange(identifiers.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add ID or passport details for this customer (optional). You can skip this step.
      </p>

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-2 size-4" />
        Add identifier
      </Button>

      {identifiers.length === 0 ? (
        <EmptyState
          icon={IdCard}
          title="No identifiers added yet"
          description="National ID, passport, or other identification can be captured here."
          action={
            <Button type="button" variant="outline" size="sm" onClick={openAdd}>
              <Plus className="mr-2 size-4" />
              Add identifier
            </Button>
          }
        />
      ) : (
        <DraftCollectionView
          storageKey={VIEW_MODE_STORAGE_KEY}
          itemCount={identifiers.length}
          renderItems={(mode) =>
            identifiers.map((identifier, index) => {
              const title = documentTypeLabel(documentTypes, identifier.documentTypeId);
              const summary = identifierInputSummary(identifier);
              const onEdit = () => openEdit(index);
              const onDelete = () => remove(index);

              if (mode === 'grid') {
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{title}</p>
                          <Badge variant={identifier.status === 'Active' ? 'default' : 'secondary'}>
                            {identifier.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{summary}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 border-b bg-card px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{title}</p>
                      <Badge variant={identifier.status === 'Active' ? 'default' : 'secondary'}>
                        {identifier.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={onEdit}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-destructive hover:underline"
                      onClick={onDelete}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          }
        />
      )}

      <ClientIdentifierFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        documentTypes={documentTypes}
        identifier={editIndex != null ? identifiers[editIndex] : undefined}
        onSave={async (input, _file, _fileName) => {
          if (editIndex != null) {
            const next = [...identifiers];
            next[editIndex] = input;
            onIdentifiersChange(next);
          } else {
            onIdentifiersChange([...identifiers, input]);
          }
          return { ok: true as const };
        }}
      />
    </div>
  );
}
