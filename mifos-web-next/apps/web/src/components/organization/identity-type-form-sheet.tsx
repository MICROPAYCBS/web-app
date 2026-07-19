'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { IdentityType, IdentityTypeTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  type IdentityTypeUpdateClearFields,
  type UpdateIdentityTypeInput,
  type UpsertIdentityTypeInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createIdentityTypeAction, updateIdentityTypeAction } from '@/actions/identity-type';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { CustomerIdentifierTypeSelectField } from '@/components/organization/customer-identifier-type-select-field';

type IdentityTypeFormState = {
  codeValueId: string;
  example: string;
  formatDescription: string;
  validationMessage: string;
  validationRegex: string;
  displayOrder: string;
  status: string;
};

function defaultFormState(): IdentityTypeFormState {
  return {
    codeValueId: '',
    example: '',
    formatDescription: '',
    validationMessage: '',
    validationRegex: '',
    displayOrder: '',
    status: 'ACTIVE'
  };
}

function formStateFromIdentityType(identityType: IdentityType): IdentityTypeFormState {
  return {
    codeValueId: String(identityType.codeValueId),
    example: identityType.example ?? '',
    formatDescription: identityType.formatDescription ?? '',
    validationMessage: identityType.validationMessage ?? '',
    validationRegex: identityType.validationRegex ?? '',
    displayOrder:
      identityType.displayOrder != null ? String(identityType.displayOrder) : '',
    status: identityType.status ?? 'ACTIVE'
  };
}

function toOptions(values: string[]) {
  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
}

function buildSubmitInput(form: IdentityTypeFormState): UpsertIdentityTypeInput {
  return {
    codeValueId: Number(form.codeValueId),
    example: form.example || undefined,
    formatDescription: form.formatDescription || undefined,
    validationMessage: form.validationMessage || undefined,
    validationRegex: form.validationRegex || undefined,
    displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
    status: form.status as UpsertIdentityTypeInput['status']
  };
}

function buildClearFields(
  form: IdentityTypeFormState,
  initial?: IdentityType
): IdentityTypeUpdateClearFields {
  return {
    displayOrder:
      initial != null && initial.displayOrder != null && form.displayOrder === ''
  };
}

export function IdentityTypeFormSheet({
  open,
  onOpenChange,
  mode,
  identityType,
  template,
  existingIdentityTypes = [],
  customerIdentifierCodeId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  identityType?: IdentityType;
  template: IdentityTypeTemplate;
  /** Listed guides — used to hide already-configured identifier types on create. */
  existingIdentityTypes?: IdentityType[];
  customerIdentifierCodeId?: number;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<IdentityTypeFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setForm(
      mode === 'edit' && identityType
        ? formStateFromIdentityType(identityType)
        : defaultFormState()
    );
  }, [open, mode, identityType]);

  const usedCodeValueIds = useMemo(
    () => new Set(existingIdentityTypes.map((row) => row.codeValueId)),
    [existingIdentityTypes]
  );

  const codeValueOptions = useMemo(() => {
    const available = template.codeValueOptions.filter(
      (option) => mode === 'edit' || !usedCodeValueIds.has(option.id)
    );
    return available.map((option) => ({
      value: String(option.id),
      label: option.name
    }));
  }, [mode, template.codeValueOptions, usedCodeValueIds]);

  const allIdentifierTypesConfigured =
    mode === 'create' && template.codeValueOptions.length > 0 && codeValueOptions.length === 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const input = buildSubmitInput(form);

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createIdentityTypeAction(input);
        if (!result.ok) {
          setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }
        toastCommandOutcome(result, { completed: 'Identity type guide created.', pending: 'Identity type guide creation sent for approval.' });
        onOpenChange(false);
        router.refresh();
        return;
      }

      if (!identityType) {
        return;
      }

      const clear = buildClearFields(form, identityType);
      const result = await updateIdentityTypeAction(
        identityType.id,
        input as UpdateIdentityTypeInput,
        clear
      );
      if (!result.ok) {
        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Identity type guide updated.', pending: 'Identity type guide update sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create identity type guide' : 'Edit identity type guide'}
      description="Define format hints and validation rules for a customer identifier type. Inactive guides are skipped on customer forms."
      formId={formId}
      submitLoading={pending}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      submitDisabled={allIdentifierTypesConfigured}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}
        {mode === 'create' ? (
          <CustomerIdentifierTypeSelectField
            label="Customer identifier type"
            customerIdentifierCodeId={customerIdentifierCodeId}
            value={form.codeValueId}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, codeValueId: value ?? '' }))
            }
            options={codeValueOptions}
            placeholder={
              allIdentifierTypesConfigured
                ? 'No identifier types available'
                : 'Select identifier type'
            }
            error={fieldErrors.codeValueId}
            required
            disabled={pending || allIdentifierTypesConfigured}
            hintOverride={
              allIdentifierTypesConfigured
                ? 'Every customer identifier type already has a guide. Add a new identifier type under Administration → Codes, or edit or delete an existing guide.'
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Customer identifier type</p>
            <p className="text-sm text-muted-foreground">{identityType?.codeValueName ?? '—'}</p>
          </div>
        )}
        <TextField
          label="Example"
          value={form.example}
          onChange={(value) => setForm((current) => ({ ...current, example: value }))}
          error={fieldErrors.example}
          disabled={pending}
          hint="Shown as placeholder when customers enter this identifier type."
        />
        <TextField
          label="Format description"
          value={form.formatDescription}
          onChange={(value) =>
            setForm((current) => ({ ...current, formatDescription: value }))
          }
          error={fieldErrors.formatDescription}
          disabled={pending}
          hint="Optional helper text describing the expected format."
        />
        <TextField
          label="Validation message"
          value={form.validationMessage}
          onChange={(value) =>
            setForm((current) => ({ ...current, validationMessage: value }))
          }
          error={fieldErrors.validationMessage}
          disabled={pending}
          hint="Shown when the document number fails validation."
        />
        <TextField
          label="Validation regex"
          value={form.validationRegex}
          onChange={(value) =>
            setForm((current) => ({ ...current, validationRegex: value }))
          }
          error={fieldErrors.validationRegex}
          disabled={pending}
          hint="Optional pattern used to validate document numbers."
        />
        <NumericField
          label="Display order"
          value={form.displayOrder}
          onChange={(value) => setForm((current) => ({ ...current, displayOrder: value }))}
          error={fieldErrors.displayOrder}
          disabled={pending}
        />
        <SelectField
          label="Status"
          value={form.status}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, status: value ?? 'ACTIVE' }))
          }
          options={toOptions(
            template.statusOptions.length > 0 ? template.statusOptions : ['ACTIVE', 'INACTIVE']
          )}
          error={fieldErrors.status}
          required
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}
