'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientContact, ContactType } from '@mifos/api-client';
import { formatActionErrorMessage, formatUgandaPhonePresentation, type ClientContactInput } from '@mifos/validation';
import { Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  createClientContactAction,
  deleteClientContactAction,
  updateClientContactAction
} from '@/actions/client-contact';
import { ClientDetailResourceView } from '@/components/clients/detail/client-detail-resource-view';
import { ClientContactFormSheet } from '@/components/clients/shared/client-contact-form-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

function missingMandatoryTypes(
  contacts: ClientContact[],
  contactTypeOptions: ContactType[]
): ContactType[] {
  const mandatoryTypes = contactTypeOptions.filter((type) => type.mandatory);
  return mandatoryTypes.filter(
    (type) => !contacts.some((contact) => contact.contactTypeId === type.id)
  );
}

export function ClientContactsView({
  clientId,
  contacts,
  contactTypeOptions,
  canCreate,
  canUpdate,
  canDelete
}: {
  clientId: string;
  contacts: ClientContact[];
  contactTypeOptions: ContactType[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientContact | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const missingRequired = useMemo(
    () => missingMandatoryTypes(contacts, contactTypeOptions),
    [contacts, contactTypeOptions]
  );

  const missingRequiredLabel =
    missingRequired.length > 0
      ? `Missing required contact type${missingRequired.length > 1 ? 's' : ''}: ${missingRequired.map((type) => type.typeName).join(', ')}. `
      : '';

  function refresh() {
    router.refresh();
  }

  async function handleSave(input: ClientContactInput) {
    if (editTarget) {
      const result = await updateClientContactAction(clientId, editTarget.id, input);
      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors),
          fieldErrors: result.fieldErrors
        };
      }
      refresh();
      return { ok: true as const };
    }

    const result = await createClientContactAction(clientId, input);
    if (!result.ok) {
      return {
        ok: false as const,
        message: formatActionErrorMessage(result.message, result.fieldErrors),
        fieldErrors: result.fieldErrors
      };
    }
    refresh();
    return { ok: true as const };
  }

  function openCreate() {
    setEditTarget(null);
    setSheetOpen(true);
  }

  function openEdit(contact: ClientContact) {
    setEditTarget(contact);
    setSheetOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientContactAction(clientId, deleteTarget.id);
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
        description="Phone numbers, email addresses, and other contact channels for this customer."
        toolbar={
          canCreate ? (
            <Button type="button" size="sm" disabled={pending} onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add contact
            </Button>
          ) : undefined
        }
        error={actionError}
        isEmpty={contacts.length === 0}
        emptyIcon={Phone}
        emptyTitle="No customer contacts"
        emptyDescription={`${missingRequiredLabel}Add mobile, email, or other contact details. Required types must be present before activation.`}
        emptyAction={
          canCreate ? (
            <Button type="button" size="sm" disabled={pending} onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add contact
            </Button>
          ) : undefined
        }
      >
        {missingRequired.length > 0 ? (
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
            {missingRequiredLabel.trim()}
          </p>
        ) : null}
        <div className="divide-y divide-border rounded-lg border border-border">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {contact.contactTypeName ?? `Type #${contact.contactTypeId}`}
                  </p>
                  {contact.primary ? <Badge variant="secondary">Primary</Badge> : null}
                  {contact.mandatory ? <Badge variant="outline">Required type</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground break-all">
                  {formatUgandaPhonePresentation(contact.contactValue) || contact.contactValue}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {canUpdate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Edit contact"
                    onClick={() => openEdit(contact)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete contact"
                    onClick={() => setDeleteTarget(contact)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ClientDetailResourceView>

      <ClientContactFormSheet
        key={editTarget?.id ?? 'create'}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditTarget(null);
          }
        }}
        contactTypeOptions={contactTypeOptions}
        contact={editTarget ?? undefined}
        onSave={handleSave}
        submitLoading={pending}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete contact</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.contactTypeName ?? 'contact'} (${deleteTarget.contactValue})?`
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
