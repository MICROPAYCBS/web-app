'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientContact, ContactType } from '@mifos/api-client';
import {
  validateClientContact,
  type ClientContactInput
} from '@mifos/validation';
import { useId, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import type { FormSubmitResult } from '@/lib/form/submit-result';

function defaultForm(contact?: ClientContact): ClientContactInput {
  return {
    contactTypeId: contact?.contactTypeId ?? 0,
    contactValue: contact?.contactValue ?? '',
    primary: contact?.primary ?? false
  };
}

export function ClientContactFormSheet({
  open,
  onOpenChange,
  contactTypeOptions,
  contact,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactTypeOptions: ContactType[];
  contact?: ClientContact;
  onSave: (input: ClientContactInput) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const [form, setForm] = useState<ClientContactInput>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = useMemo(
    () => contactTypeOptions.find((option) => option.id === form.contactTypeId),
    [contactTypeOptions, form.contactTypeId]
  );

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultForm(contact));
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = validateClientContact(form, { contactTypeOptions });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          fieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(fieldErrors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSave(parsed.data);
      if (!result.ok) {
        setError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const typeOptions = contactTypeOptions.map((option) => ({
    value: String(option.id),
    label: option.mandatory ? `${option.typeName} (required)` : option.typeName
  }));

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={contact ? 'Edit customer contact' : 'Add customer contact'}
      description="Choose a contact type and enter the value. Primary marks the preferred contact for that type."
      formId={formId}
      submitLoading={submitLoading || isSubmitting}
      submitLabel={contact ? 'Save changes' : 'Add contact'}
      error={error}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Contact type"
          required
          value={form.contactTypeId ? String(form.contactTypeId) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              contactTypeId: value ? Number(value) : 0
            }))
          }
          options={typeOptions}
          placeholder="Select contact type"
          error={fieldErrors.contactTypeId}
          disabled={Boolean(contact)}
        />
        <TextField
          label="Contact value"
          required
          value={form.contactValue}
          onChange={(value) => setForm((current) => ({ ...current, contactValue: value }))}
          placeholder={selectedType?.example ?? 'Enter contact details'}
          hint={selectedType?.example ? `Example: ${selectedType.example}` : undefined}
          error={fieldErrors.contactValue}
        />
        <Field>
          <FieldContent className="flex flex-row items-center gap-2">
            <Checkbox
              id={`${formId}-primary`}
              checked={form.primary ?? false}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, primary: checked === true }))
              }
            />
            <FieldLabel htmlFor={`${formId}-primary`} className="font-normal">
              Primary for this contact type
            </FieldLabel>
          </FieldContent>
        </Field>
      </form>
    </FormSheet>
  );
}
