'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientIdentifierInput } from '@mifos/validation';
import { useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormSubmitResult } from '@/lib/form/submit-result';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

function defaultForm(): ClientIdentifierInput {
  return {
    documentTypeId: 0,
    status: 'Active',
    documentKey: '',
    description: ''
  };
}

export function ClientIdentifierFormSheet({
  open,
  onOpenChange,
  documentTypes,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypes: { id: number; name: string }[];
  onSave: (
    input: ClientIdentifierInput,
    file: File | null,
    fileName: string
  ) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const [form, setForm] = useState<ClientIdentifierInput>(defaultForm);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultForm());
      setFile(null);
      setFileName('');
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    if (!form.documentTypeId || !form.documentKey.trim()) {
      setError('Type and document key are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave(form, file, fileName.trim() || file?.name || '');
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
      title="Add identifier"
      description="Record an official ID type, key, and optional supporting document."
      formId={formId}
      onSubmit={handleSubmit}
      submitLabel="Add identifier"
      submitLoading={isSubmitting || submitLoading}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <SelectField
          id={`${formId}-documentTypeId`}
          label="Type"
          required
          value={form.documentTypeId ? String(form.documentTypeId) : ''}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, documentTypeId: Number(value) || 0 }))
          }
          options={documentTypes.map((type) => ({
            value: String(type.id),
            label: type.name
          }))}
          placeholder="Select type"
        />
        <SelectField
          id={`${formId}-status`}
          label="Status"
          required
          value={form.status}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              status: value === 'Inactive' ? 'Inactive' : 'Active'
            }))
          }
          options={STATUS_OPTIONS}
        />
        <TextField
          id={`${formId}-documentKey`}
          label="Document key"
          required
          value={form.documentKey}
          onChange={(value) => setForm((current) => ({ ...current, documentKey: value }))}
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          value={form.description ?? ''}
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />
        <div className="space-y-2">
          <Label htmlFor={`${formId}-file`}>Supporting document (optional)</Label>
          <Input
            id={`${formId}-file`}
            type="file"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              if (nextFile && !fileName.trim()) {
                setFileName(nextFile.name);
              }
            }}
          />
          {file ? (
            <TextField
              id={`${formId}-fileName`}
              label="File name"
              value={fileName}
              onChange={setFileName}
            />
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
