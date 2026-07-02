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
import { createIndustryAction, updateIndustryAction } from '@/actions/industry';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import type { Industry, IndustryTemplate } from '@/lib/fineract/industries';

type IndustryFormState = {
  industryCode: string;
  industryName: string;
  description: string;
  sectorId: string;
  regulatoryCode: string;
  riskLevel: string;
  status: string;
  priorityIndustry: boolean;
  prohibitedIndustry: boolean;
  requiresEdd: boolean;
};

function defaultFormState(): IndustryFormState {
  return {
    industryCode: '',
    industryName: '',
    description: '',
    sectorId: '',
    regulatoryCode: '',
    riskLevel: '',
    status: 'ACTIVE',
    priorityIndustry: false,
    prohibitedIndustry: false,
    requiresEdd: false
  };
}

function validateIndustryForm(payload: {
  industryCode: string;
  industryName: string;
}): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  if (!payload.industryCode) {
    fieldErrors.industryCode = 'Industry code is required.';
  }
  if (!payload.industryName) {
    fieldErrors.industryName = 'Industry name is required.';
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function formStateFromIndustry(industry: Industry): IndustryFormState {
  return {
    industryCode: industry.industryCode,
    industryName: industry.industryName,
    description: industry.description ?? '',
    sectorId: industry.sectorId != null ? String(industry.sectorId) : '',
    regulatoryCode: industry.regulatoryCode ?? '',
    riskLevel: industry.riskLevel ?? '',
    status: industry.status ?? 'ACTIVE',
    priorityIndustry: industry.priorityIndustry ?? false,
    prohibitedIndustry: industry.prohibitedIndustry ?? false,
    requiresEdd: industry.requiresEdd ?? false
  };
}

export function IndustryFormSheet({
  open,
  onOpenChange,
  mode,
  template,
  industry
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  template: IndustryTemplate;
  industry?: Industry;
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
    setForm(mode === 'edit' && industry ? formStateFromIndustry(industry) : defaultFormState());
    setFieldErrors({});
    setFormError(null);
  }, [open, mode, industry]);

  function submit() {
    setFormError(null);
    setFieldErrors({});

    const payload = {
      industryCode: form.industryCode.trim(),
      industryName: form.industryName.trim(),
      description: form.description.trim() || undefined,
      sectorId: form.sectorId ? Number(form.sectorId) : undefined,
      regulatoryCode: form.regulatoryCode.trim() || undefined,
      riskLevel: form.riskLevel.trim() || undefined,
      status: form.status || 'ACTIVE',
      priorityIndustry: form.priorityIndustry,
      prohibitedIndustry: form.prohibitedIndustry,
      requiresEdd: form.requiresEdd
    };

    const validationErrors = validateIndustryForm(payload);
    if (validationErrors) {
      setFieldErrors(validationErrors);
      setFormError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createIndustryAction(payload)
          : await updateIndustryAction(industry!.id, payload);

      if (!result.ok) {
        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toast.success(mode === 'create' ? 'Industry created.' : 'Industry updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  const sectorOptions = template.sectorOptions.map((option) => ({
    value: String(option.id),
    label: option.sectorName
  }));

  const statusOptions = (template.statusOptions.length > 0 ? template.statusOptions : ['ACTIVE', 'INACTIVE']).map(
    (value) => ({ value, label: value.replaceAll('_', ' ') })
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create industry' : 'Edit industry'}
      description="Industry classification linked to an economic sector."
      submitLabel={mode === 'create' ? 'Create industry' : 'Save changes'}
      submitLoading={pending}
      onSubmit={submit}
    >
      <div className="space-y-4">
        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}
        <TextField
        label="Industry code"
        value={form.industryCode}
        onChange={(value) => setForm((current) => ({ ...current, industryCode: value }))}
        error={fieldErrors.industryCode}
        required
      />
      <TextField
        label="Industry name"
        value={form.industryName}
        onChange={(value) => setForm((current) => ({ ...current, industryName: value }))}
        error={fieldErrors.industryName}
        required
      />
      <TextField
        label="Description"
        value={form.description}
        onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        multiline
      />
      <SelectField
        label="Sector"
        value={form.sectorId || undefined}
        onValueChange={(value) => setForm((current) => ({ ...current, sectorId: value ?? '' }))}
        options={sectorOptions}
        placeholder="Select sector"
        optional
      />
      <TextField
        label="Regulatory code"
        value={form.regulatoryCode}
        onChange={(value) => setForm((current) => ({ ...current, regulatoryCode: value }))}
      />
      <TextField
        label="Risk level"
        value={form.riskLevel}
        onChange={(value) => setForm((current) => ({ ...current, riskLevel: value }))}
      />
      <SelectField
        label="Status"
        value={form.status}
        onValueChange={(value) => setForm((current) => ({ ...current, status: value ?? 'ACTIVE' }))}
        options={statusOptions}
      />
      <Field>
        <FieldLabel>Flags</FieldLabel>
        <FieldContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.priorityIndustry}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, priorityIndustry: checked === true }))
              }
            />
            Priority industry
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.prohibitedIndustry}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, prohibitedIndustry: checked === true }))
              }
            />
            Prohibited industry
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.requiresEdd}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, requiresEdd: checked === true }))
              }
            />
            Requires enhanced due diligence
          </label>
        </FieldContent>
      </Field>
      </div>
    </FormSheet>
  );
}
