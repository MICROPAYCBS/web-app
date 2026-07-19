'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDocumentMetadataInput } from '@mifos/validation';
import { useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormSubmitResult } from '@/lib/form/submit-result';

function defaultForm(): ClientDocumentMetadataInput {
  return { name: '', description: '' };
}

export function ClientDocumentFormSheet({
  open,
  onOpenChange,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ClientDocumentMetadataInput, file: File) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const [form, setForm] = useState<ClientDocumentMetadataInput>(defaultForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultForm());
      setFile(null);
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave(form, file);
      if (result.ok) {
        handleOpenChange(false);
        return;
      }
      setError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Upload document"
      description="Attach a file to this customer record."
      formId={formId}
      onSubmit={handleSubmit}
      submitLabel="Upload"
      submitLoading={isSubmitting || submitLoading}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor={`${formId}-file`}>File</Label>
          <Input
            id={`${formId}-file`}
            type="file"
            required
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              if (nextFile && !form.name.trim()) {
                setForm((current) => ({ ...current, name: nextFile.name }));
              }
            }}
          />
        </div>
        <TextField
          id={`${formId}-name`}
          label="Name"
          required
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          value={form.description ?? ''}
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
