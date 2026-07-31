'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ContactType } from '@mifos/api-client';
import {
  stripPhoneSpaces,
  UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER,
  UGANDA_PHONE_INTERNATIONAL_HINT,
  type ClientContactInput
} from '@mifos/validation';
import { Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/composites';
import { ClientContactFormSheet } from '@/components/clients/shared/client-contact-form-sheet';
import { TextField } from '@/components/composites/text-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ClientGeneralFormState, CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

function contactTypeLabel(
  contactTypeOptions: ContactType[],
  contactTypeId: number
): string {
  return (
    contactTypeOptions.find((option) => option.id === contactTypeId)?.typeName ??
    `Type #${contactTypeId}`
  );
}

export function ContactStep({
  draft,
  errors,
  contactTypeOptions,
  onDraftChange,
  onContactsChange
}: {
  draft: CreateClientDraft;
  errors: StepErrors;
  contactTypeOptions: ContactType[];
  onDraftChange: (patch: Partial<ClientGeneralFormState>) => void;
  onContactsChange: (contacts: ClientContactInput[]) => void;
}) {
  const g = draft.general;
  const contacts = draft.contacts;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  function openAdd() {
    setEditIndex(null);
    setSheetOpen(true);
  }

  function openEdit(index: number) {
    setEditIndex(index);
    setSheetOpen(true);
  }

  function remove(index: number) {
    onContactsChange(contacts.filter((_, i) => i !== index));
  }

  async function handleSave(input: ClientContactInput) {
    if (editIndex != null) {
      onContactsChange(contacts.map((contact, index) => (index === editIndex ? input : contact)));
    } else {
      onContactsChange([...contacts, input]);
    }
    return { ok: true as const };
  }

  const editContact =
    editIndex != null
      ? {
          id: editIndex,
          contactTypeId: contacts[editIndex]?.contactTypeId ?? 0,
          contactValue: contacts[editIndex]?.contactValue ?? '',
          primary: contacts[editIndex]?.primary
        }
      : undefined;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="primary">
        <TabsList>
          <TabsTrigger value="primary">Primary contact</TabsTrigger>
          <TabsTrigger value="additional">
            Additional contacts{contacts.length > 0 ? ` (${contacts.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primary" className="space-y-6 pt-4">
          <p className="text-sm text-muted-foreground">
            Primary and alternative phone numbers and email addresses for this customer. These are
            also stored as typed contacts when matching contact types exist.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="mobileNo"
              label="Phone number"
              required
              type="tel"
              autoComplete="tel"
              placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
              hint={UGANDA_PHONE_INTERNATIONAL_HINT}
              value={g.mobileNo ?? ''}
              onChange={(v) => onDraftChange({ mobileNo: stripPhoneSpaces(v) })}
              error={errors.mobileNo}
            />

            <TextField
              id="alternativeMobileNo"
              label="Alternative phone number"
              optional
              type="tel"
              autoComplete="tel"
              placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
              hint={UGANDA_PHONE_INTERNATIONAL_HINT}
              value={g.alternativeMobileNo ?? ''}
              onChange={(v) => onDraftChange({ alternativeMobileNo: stripPhoneSpaces(v) })}
              error={errors.alternativeMobileNo}
            />

            <TextField
              id="emailAddress"
              label="Email"
              optional
              type="email"
              value={g.emailAddress ?? ''}
              onChange={(v) => onDraftChange({ emailAddress: v })}
              error={errors.emailAddress}
            />

            <TextField
              id="alternativeEmailAddress"
              label="Alternative email"
              optional
              type="email"
              value={g.alternativeEmailAddress ?? ''}
              onChange={(v) => onDraftChange({ alternativeEmailAddress: v })}
              error={errors.alternativeEmailAddress}
            />
          </div>
        </TabsContent>

        <TabsContent value="additional" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Add other contact channels by type (for example WhatsApp or office phone). This step is
            optional.
          </p>

          {errors.contacts ? <p className="text-sm text-destructive">{errors.contacts}</p> : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openAdd}
            disabled={contactTypeOptions.length === 0}
          >
            <Plus className="mr-2 size-4" />
            Add contact
          </Button>

          {contactTypeOptions.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No contact types configured"
              description="Ask an administrator to add contact types before capturing additional contacts."
            />
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No additional contacts yet"
              description="Primary phone and email are on the first tab. Add other channels here if needed."
              action={
                <Button type="button" variant="outline" size="sm" onClick={openAdd}>
                  <Plus className="mr-2 size-4" />
                  Add contact
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {contacts.map((contact, index) => (
                <div
                  key={`${contact.contactTypeId}-${contact.contactValue}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {contactTypeLabel(contactTypeOptions, contact.contactTypeId)}
                      </p>
                      {contact.primary ? <Badge variant="secondary">Primary</Badge> : null}
                    </div>
                    <p className="break-all text-sm text-muted-foreground">{contact.contactValue}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit contact"
                      onClick={() => openEdit(index)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove contact"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ClientContactFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contactTypeOptions={contactTypeOptions}
        contact={editContact}
        onSave={handleSave}
      />
    </div>
  );
}
