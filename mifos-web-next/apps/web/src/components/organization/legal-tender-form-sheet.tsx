'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createLegalTenderAction, updateLegalTenderAction } from '@/actions/legal-tender';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type LegalTenderFormState = {
  value: string;
  tenderType: 'NOTE' | 'COIN';
  label: string;
  displayOrder: string;
  active: boolean;
};

function defaultFormState(): LegalTenderFormState {
  return {
    value: '',
    tenderType: 'NOTE',
    label: '',
    displayOrder: '0',
    active: true
  };
}

function formStateFromLegalTender(tender: CurrencyLegalTender): LegalTenderFormState {
  return {
    value: String(tender.value),
    tenderType: tender.tenderType,
    label: tender.label,
    displayOrder: String(tender.displayOrder),
    active: tender.active
  };
}

export function LegalTenderFormSheet({
  currencyCode,
  decimalPlaces,
  open,
  onOpenChange,
  mode,
  legalTender
}: {
  currencyCode: string;
  decimalPlaces: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  legalTender?: CurrencyLegalTender;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<LegalTenderFormState>(() =>
    legalTender ? formStateFromLegalTender(legalTender) : defaultFormState()
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(legalTender ? formStateFromLegalTender(legalTender) : defaultFormState());
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        value: form.value,
        tenderType: form.tenderType,
        label: form.label,
        displayOrder: form.displayOrder,
        active: form.active
      };

      const result =
        mode === 'create'
          ? await createLegalTenderAction(currencyCode, payload)
          : await updateLegalTenderAction(currencyCode, legalTender!.id, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toast.success(mode === 'create' ? 'Legal tender created.' : 'Legal tender updated.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create legal tender' : 'Edit legal tender'}
      description={`Configure a note or coin denomination for ${currencyCode}.`}
      formId={formId}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4">
        <NumericField
          label="Face value"
          required
          value={form.value}
          onChange={(value) => setForm((current) => ({ ...current, value }))}
          integer={decimalPlaces === 0}
          maxDecimalPlaces={decimalPlaces > 0 ? decimalPlaces : undefined}
          error={fieldErrors.value}
          disabled={pending}
        />
        <SelectField
          label="Type"
          required
          value={form.tenderType}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              tenderType: (value as 'NOTE' | 'COIN' | null) ?? 'NOTE'
            }))
          }
          options={[
            { value: 'NOTE', label: 'Note' },
            { value: 'COIN', label: 'Coin' }
          ]}
          error={fieldErrors.tenderType}
          disabled={pending}
        />
        <TextField
          label="Label"
          required
          value={form.label}
          onChange={(value) => setForm((current) => ({ ...current, label: value }))}
          error={fieldErrors.label}
          disabled={pending}
        />
        <NumericField
          label="Display order"
          required
          integer
          value={form.displayOrder}
          onChange={(value) => setForm((current) => ({ ...current, displayOrder: value }))}
          error={fieldErrors.displayOrder}
          disabled={pending}
        />
        <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor={`${formId}-active`}>Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive denominations are hidden from allocate and settle forms.
            </p>
          </div>
          <Switch
            id={`${formId}-active`}
            checked={form.active}
            disabled={pending}
            onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
          />
        </div>
      </form>
    </FormSheet>
  );
}
