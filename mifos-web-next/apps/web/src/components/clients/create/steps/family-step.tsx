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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FamilyMemberDialog } from '../family-member-dialog';
import type { CreateClientDraft } from '../types';
import { Button } from '@/components/ui/button';

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
        Add family members linked to this client (optional). You can skip this step.
      </p>

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-2 size-4" />
        Add family member
      </Button>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No family members added yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {members.map((member, index) => (
            <li key={index} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                {member.firstName} {member.middleName ? `${member.middleName} ` : ''}
                {member.lastName}
              </span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(index)}>
                  <Pencil className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={template.familyMemberOptions}
        member={editIndex != null ? members[editIndex] : undefined}
        onSave={(member) => {
          if (editIndex != null) {
            const next = [...members];
            next[editIndex] = member;
            onFamilyChange(next);
          } else {
            onFamilyChange([...members, member]);
          }
        }}
      />

    </div>
  );
}
