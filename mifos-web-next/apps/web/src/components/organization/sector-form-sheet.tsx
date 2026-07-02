'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createSectorAction, updateSectorAction } from '@/actions/sector';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { Sector, SectorTemplate } from '@/lib/fineract/sectors';

type SectorFormState = {
  sectorCode: string;
  sectorName: string;
  description: string;
  parentId: string;
  riskLevel: string;
  regulatoryCode: string;
  status: string;
};

function defaultFormState(): SectorFormState {
  return {
    sectorCode: '',
    sectorName: '',
    description: '',
    parentId: '',
    riskLevel: '',
    regulatoryCode: '',
    status: 'ACTIVE'
  };
}

function validateSectorForm(payload: {
  sectorCode: string;
  sectorName: string;
}): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  if (!payload.sectorCode) {
    fieldErrors.sectorCode = 'Sector code is required.';
  }
  if (!payload.sectorName) {
    fieldErrors.sectorName = 'Sector name is required.';
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function formStateFromSector(sector: Sector): SectorFormState {
  return {
    sectorCode: sector.sectorCode,
    sectorName: sector.sectorName,
    description: sector.description ?? '',
    parentId: sector.parentId != null ? String(sector.parentId) : '',
    riskLevel: sector.riskLevel ?? '',
    regulatoryCode: sector.regulatoryCode ?? '',
    status: sector.status ?? 'ACTIVE'
  };
}

function toOptions(values: string[]) {
  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
}

export function SectorFormSheet({
  open,
  onOpenChange,
  mode,
  template,
  sector
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  template: SectorTemplate;
  sector?: Sector;
}) {
  const router = useRouter();
  const [form, setForm] = useState(defaultFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(mode === 'edit' && sector ? formStateFromSector(sector) : defaultFormState());
    setFieldErrors({});
    setFormError(null);
  }, [open, mode, sector]);

  function updateField<K extends keyof SectorFormState>(key: K, value: SectorFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setFormError(null);
    setFieldErrors({});

    const payload = {
      sectorCode: form.sectorCode.trim(),
      sectorName: form.sectorName.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : undefined,
      riskLevel: form.riskLevel.trim() || undefined,
      regulatoryCode: form.regulatoryCode.trim() || undefined,
      status: form.status || 'ACTIVE'
    };

    const validationErrors = validateSectorForm(payload);
    if (validationErrors) {
      setFieldErrors(validationErrors);
      setFormError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSectorAction(payload)
          : await updateSectorAction(sector!.id, payload);

      if (!result.ok) {
        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toast.success(mode === 'create' ? 'Sector created.' : 'Sector updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  const parentOptions = template.parentSectorOptions
    .filter((option) => (mode === 'edit' && sector ? option.id !== sector.id : true))
    .map((option) => ({ value: String(option.id), label: option.sectorName }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create sector' : 'Edit sector'}
      description="Economic sector master data used for customer and loan classification."
      submitLabel={mode === 'create' ? 'Create sector' : 'Save changes'}
      submitLoading={pending}
      onSubmit={submit}
    >
      <div className="space-y-4">
        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}
        <TextField
        label="Sector code"
        value={form.sectorCode}
        onChange={(value) => updateField('sectorCode', value)}
        error={fieldErrors.sectorCode}
        required
      />
      <TextField
        label="Sector name"
        value={form.sectorName}
        onChange={(value) => updateField('sectorName', value)}
        error={fieldErrors.sectorName}
        required
      />
      <TextField
        label="Description"
        value={form.description}
        onChange={(value) => updateField('description', value)}
        multiline
      />
      <SelectField
        label="Parent sector"
        value={form.parentId || undefined}
        onValueChange={(value) => updateField('parentId', value ?? '')}
        options={parentOptions}
        placeholder="None"
        optional
      />
      <TextField
        label="Risk level"
        value={form.riskLevel}
        onChange={(value) => updateField('riskLevel', value)}
      />
      <TextField
        label="Regulatory code"
        value={form.regulatoryCode}
        onChange={(value) => updateField('regulatoryCode', value)}
      />
      <SelectField
        label="Status"
        value={form.status}
        onValueChange={(value) => updateField('status', value ?? 'ACTIVE')}
        options={toOptions(template.statusOptions.length > 0 ? template.statusOptions : ['ACTIVE', 'INACTIVE'])}
      />
      </div>
    </FormSheet>
  );
}
