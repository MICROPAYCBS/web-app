'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationFund } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { createFundAction, updateFundAction } from '@/actions/fund';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';

type FundFormState = {
  name: string;
  externalId: string;
};

function defaultFormState(): FundFormState {
  return { name: '', externalId: '' };
}

function formStateFromFund(fund: OrganizationFund): FundFormState {
  return {
    name: fund.name,
    externalId: fund.externalId ?? ''
  };
}

export function FundFormSheet({
  open,
  onOpenChange,
  mode,
  fund
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  fund?: OrganizationFund;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<FundFormState>(
    fund ? formStateFromFund(fund) : defaultFormState()
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patchForm(patch: Partial<FundFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createFundAction(form)
          : await updateFundAction(fund!.id, form);

      if (!result.ok) {
        setFormError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toastCommandOutcome(result, {
        completed: mode === 'create' ? 'Fund created.' : 'Fund updated.',
        pending: 'Fund change sent for approval.'
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create fund' : 'Edit fund'}
      description="Funds group loan products for reporting and portfolio tracking."
      formId={formId}
      submitLoading={pending}
      submitLabel={mode === 'create' ? 'Create' : 'Save'}
      error={formError ? <FormErrorAlert>{formError}</FormErrorAlert> : undefined}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          required
          error={fieldErrors.name}
        />
        <TextField
          label="External ID"
          value={form.externalId}
          onChange={(value) => patchForm({ externalId: value })}
          error={fieldErrors.externalId}
        />
      </form>
    </FormSheet>
  );
}
