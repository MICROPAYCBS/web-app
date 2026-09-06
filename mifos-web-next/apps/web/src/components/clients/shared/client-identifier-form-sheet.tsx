'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  clampDocumentKeyInput,
  documentKeyMaxLengthForIdentityRule,
  findIdentityTypeRule,
  validateClientIdentifier,
  type ClientIdentifierIdentityTypeOption,
  type ClientIdentifierInput
} from '@mifos/validation';
import { useId, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DOCUMENT_UPLOAD_ACCEPT,
  DOCUMENT_UPLOAD_ACCEPT_LABEL,
  DOCUMENT_UPLOAD_REJECTED_MESSAGE,
  isAllowedDocumentUpload
} from '@/lib/documents/document-preview';
import type { FormSubmitResult } from '@/lib/form/submit-result';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

function defaultForm(identifier?: ClientIdentifierInput): ClientIdentifierInput {
  return {
    documentTypeId: identifier?.documentTypeId ?? 0,
    status: identifier?.status ?? 'Active',
    documentKey: identifier?.documentKey ?? '',
    description: identifier?.description ?? ''
  };
}

export function ClientIdentifierFormSheet({
  open,
  onOpenChange,
  documentTypes,
  identityTypeOptions = [],
  identifier,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypes: { id: number; name: string }[];
  identityTypeOptions?: ClientIdentifierIdentityTypeOption[];
  identifier?: ClientIdentifierInput;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationContext = useMemo(
    () => ({ identityTypeOptions }),
    [identityTypeOptions]
  );

  const selectedRule = useMemo(
    () => findIdentityTypeRule(form.documentTypeId, identityTypeOptions),
    [form.documentTypeId, identityTypeOptions]
  );

  const documentKeyMaxLength = useMemo(
    () => documentKeyMaxLengthForIdentityRule(selectedRule),
    [selectedRule]
  );

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultForm(identifier));
      setFile(null);
      setFileName('');
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  function validateForm(): boolean {
    const parsed = validateClientIdentifier(form, validationContext);
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    const nextFieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        nextFieldErrors[key] = issue.message;
      }
    }
    setFieldErrors(nextFieldErrors);
    setError(
      nextFieldErrors.documentKey
        ? null
        : 'Type and document number are required.'
    );
    return false;
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    if (!validateForm()) {
      return;
    }
    if (file && !isAllowedDocumentUpload(file)) {
      setError(DOCUMENT_UPLOAD_REJECTED_MESSAGE);
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
      if (!result.ok && result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const documentKeyHint = selectedRule?.formatDescription
    ? selectedRule.formatDescription
    : selectedRule?.example
      ? `Example: ${selectedRule.example}`
      : undefined;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={identifier ? 'Edit identifier' : 'Add identifier'}
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
          onValueChange={(value) => {
            const documentTypeId = Number(value) || 0;
            const nextRule = findIdentityTypeRule(documentTypeId, identityTypeOptions);
            const maxLength = documentKeyMaxLengthForIdentityRule(nextRule);
            setForm((current) => ({
              ...current,
              documentTypeId,
              documentKey: clampDocumentKeyInput(current.documentKey, maxLength)
            }));
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.documentTypeId;
              delete next.documentKey;
              return next;
            });
          }}
          options={documentTypes.map((type) => ({
            value: String(type.id),
            label: type.name
          }))}
          placeholder="Select type"
          error={fieldErrors.documentTypeId}
        />
        <TextField
          id={`${formId}-documentKey`}
          label="Document number"
          required
          value={form.documentKey}
          maxLength={documentKeyMaxLength}
          onChange={(value) => {
            const nextValue = clampDocumentKeyInput(value, documentKeyMaxLength);
            setForm((current) => ({ ...current, documentKey: nextValue }));
            if (fieldErrors.documentKey) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.documentKey;
                return next;
              });
            }
          }}
          error={fieldErrors.documentKey}
          placeholder={selectedRule?.example ?? undefined}
          hint={documentKeyHint}
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
            accept={DOCUMENT_UPLOAD_ACCEPT}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              if (nextFile && !isAllowedDocumentUpload(nextFile)) {
                setError(DOCUMENT_UPLOAD_REJECTED_MESSAGE);
                return;
              }
              setError(null);
              if (nextFile && !fileName.trim()) {
                setFileName(nextFile.name);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Accepted: {DOCUMENT_UPLOAD_ACCEPT_LABEL}</p>
          {file ? (
            <TextField
              id={`${formId}-fileName`}
              label="File name"
              value={fileName}
              onChange={setFileName}
            />
          ) : null}
        </div>
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
