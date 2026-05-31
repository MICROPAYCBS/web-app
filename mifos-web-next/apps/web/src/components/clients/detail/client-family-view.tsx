'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientFamilyMember, FineractFamilyMemberOptions } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FamilyMemberFormSheet } from '@/components/clients/shared/family-member-form-sheet';
import {
  ClientFamilyPanel,
  familyMemberDisplayName
} from '@/components/clients/detail/client-family-sections';
import {
  createClientFamilyMemberAction,
  deleteClientFamilyMemberAction,
  updateClientFamilyMemberAction
} from '@/actions/client-family';
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
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fromFineractDateArray,
  toFineractDate
} from '@/lib/fineract/dates';

function toFamilyMemberInput(member: FineractClientFamilyMember): FamilyMemberInput {
  let dateOfBirth: string | undefined;
  if (Array.isArray(member.dateOfBirth)) {
    const date = fromFineractDateArray(member.dateOfBirth);
    dateOfBirth = date ? toFineractDate(date) : undefined;
  } else if (typeof member.dateOfBirth === 'string') {
    dateOfBirth = member.dateOfBirth;
  }

  return {
    firstName: member.firstName,
    middleName: member.middleName,
    lastName: member.lastName,
    qualification: member.qualification,
    relationshipId: member.relationshipId ?? 0,
    genderId: member.genderId ?? 0,
    professionId: member.professionId,
    maritalStatusId: member.maritalStatusId,
    isDependent: member.isDependent ?? false,
    age: member.age,
    dateOfBirth,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function ClientFamilyView({
  clientId,
  members: initialMembers,
  familyOptions,
  canUpdate
}: {
  clientId: string;
  members: FineractClientFamilyMember[];
  familyOptions: FineractFamilyMemberOptions | undefined;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<FineractClientFamilyMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FineractClientFamilyMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleSave(entry: FamilyMemberInput) {
    setActionError(null);
    startTransition(async () => {
      const result = editMember
        ? await updateClientFamilyMemberAction(clientId, editMember.id, entry)
        : await createClientFamilyMemberAction(clientId, entry);

      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDialogOpen(false);
      setEditMember(null);
      refresh();
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientFamilyMemberAction(clientId, deleteTarget.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Family members linked to this client in Fineract.
        </p>
        {canUpdate ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => {
              setEditMember(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Add family member
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {initialMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No family members on file"
          description="Add family members linked to this client for household or next-of-kin records."
          action={
            canUpdate ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setEditMember(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Add family member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {initialMembers.map((member) => (
            <ClientFamilyPanel
              key={member.id}
              member={member}
              canUpdate={canUpdate}
              onEdit={() => {
                setEditMember(member);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(member)}
            />
          ))}
        </div>
      )}

      <FamilyMemberFormSheet
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditMember(null);
          }
        }}
        options={familyOptions}
        member={editMember ? toFamilyMemberInput(editMember) : undefined}
        onSave={handleSave}
        submitLoading={pending}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete family member</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove ${familyMemberDisplayName(deleteTarget)} from this client? This cannot be undone.`
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
