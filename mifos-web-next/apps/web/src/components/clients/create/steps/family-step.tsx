'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { FamilyMemberFormSheet } from '@/components/clients/shared/family-member-form-sheet';
import {
  ClientFamilyGridCard,
  ClientFamilyListItem,
  familyMemberInputDisplayName,
  formatFamilyMemberInputSummary
} from '@/components/clients/detail/client-family-sections';
import { DraftCollectionView } from '@/components/clients/shared/draft-collection-view';
import type { CreateClientDraft } from '../types';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';

const VIEW_MODE_STORAGE_KEY = 'mifos.create-client.family.view-mode';

function relationshipLabel(
  template: FineractClientTemplate,
  relationshipId: number
): string | undefined {
  return template.familyMemberOptions?.relationshipIdOptions?.find((o) => o.id === relationshipId)
    ?.name;
}

export function FamilyStep({
  template,
  draft,
  onFamilyChange
}: {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  onFamilyChange: (members: FamilyMemberInput[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const members = draft.familyMembers;

  function openAdd() {
    setEditIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setEditIndex(index);
    setDialogOpen(true);
  }

  function remove(index: number) {
    onFamilyChange(members.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add next of kin linked to this client (optional). You can skip this step.
      </p>

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-2 size-4" />
        Add next of kin
      </Button>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No next of kin added yet"
          description="This step is optional. Add household or emergency contacts if needed."
          action={
            <Button type="button" variant="outline" size="sm" onClick={openAdd}>
              <Plus className="mr-2 size-4" />
              Add next of kin
            </Button>
          }
        />
      ) : (
        <DraftCollectionView
          storageKey={VIEW_MODE_STORAGE_KEY}
          itemCount={members.length}
          renderItems={(mode) =>
            members.map((member, index) => {
              const title = familyMemberInputDisplayName(member);
              const summary = formatFamilyMemberInputSummary(
                member,
                relationshipLabel(template, member.relationshipId)
              );
              const onEdit = () => openEdit(index);
              const onDelete = () => remove(index);

              if (mode === 'grid') {
                return (
                  <ClientFamilyGridCard
                    key={index}
                    title={title}
                    summary={summary}
                    isDependent={member.isDependent}
                    canUpdate
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              }

              return (
                <ClientFamilyListItem
                  key={index}
                  title={title}
                  summary={summary}
                  isDependent={member.isDependent}
                  canUpdate
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })
          }
        />
      )}

      <FamilyMemberFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={template.familyMemberOptions}
        member={editIndex != null ? members[editIndex] : undefined}
        onSave={async (member) => {
          if (editIndex != null) {
            const next = [...members];
            next[editIndex] = member;
            onFamilyChange(next);
          } else {
            onFamilyChange([...members, member]);
          }
          return { ok: true as const };
        }}
      />
    </div>
  );
}
