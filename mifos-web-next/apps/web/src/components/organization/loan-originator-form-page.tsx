'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorTemplate } from '@mifos/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  createLoanOriginatorAction,
  updateLoanOriginatorAction
} from '@/actions/loan-originators';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  LOAN_ORIGINATOR_LIST_PATH,
  loanOriginatorDetailPath
} from '@/lib/fineract/loan-originator-paths';
import { formatLoanOriginatorStatus } from '@/lib/fineract/loan-originator-display';
import { toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';

type LoanOriginatorFormState = {
  externalId: string;
  name: string;
  status: string;
  originatorTypeId: string;
  channelTypeId: string;
};

function defaultFormState(template: LoanOriginatorTemplate): LoanOriginatorFormState {
  return {
    externalId: template.externalId ?? '',
    name: '',
    status: '',
    originatorTypeId: '',
    channelTypeId: ''
  };
}

function formStateFromInitial(
  template: LoanOriginatorTemplate,
  initial?: Partial<LoanOriginatorFormState>
): LoanOriginatorFormState {
  return {
    ...defaultFormState(template),
    ...initial,
    originatorTypeId:
      initial?.originatorTypeId != null && initial.originatorTypeId !== ''
        ? String(initial.originatorTypeId)
        : '',
    channelTypeId:
      initial?.channelTypeId != null && initial.channelTypeId !== ''
        ? String(initial.channelTypeId)
        : ''
  };
}

export function LoanOriginatorFormPage({
  mode,
  loanOriginatorId,
  template,
  initial
}: {
  mode: 'create' | 'edit';
  loanOriginatorId?: number;
  template: LoanOriginatorTemplate;
  initial?: Partial<LoanOriginatorFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LoanOriginatorFormState>(() =>
    formStateFromInitial(template, initial)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const statusOptions = useMemo(
    () =>
      template.statusOptions.map((status) => ({
        value: status,
        label: formatLoanOriginatorStatus(status)
      })),
    [template.statusOptions]
  );

  const originatorTypeOptions = useMemo(
    () => toSelectOptions(template.originatorTypeOptions),
    [template.originatorTypeOptions]
  );

  const channelTypeOptions = useMemo(
    () => toSelectOptions(template.channelTypeOptions),
    [template.channelTypeOptions]
  );

  function updateForm<K extends keyof LoanOriginatorFormState>(
    key: K,
    value: LoanOriginatorFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const sharedPayload = {
      name: form.name,
      status: form.status,
      originatorTypeId: form.originatorTypeId ? Number(form.originatorTypeId) : undefined,
      channelTypeId: form.channelTypeId ? Number(form.channelTypeId) : undefined
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createLoanOriginatorAction({
              externalId: form.externalId,
              ...sharedPayload
            })
          : await updateLoanOriginatorAction(String(loanOriginatorId), sharedPayload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      if (mode === 'create' && result.loanOriginatorId != null) {
        router.push(loanOriginatorDetailPath(result.loanOriginatorId));
      } else if (loanOriginatorId != null) {
        router.push(loanOriginatorDetailPath(loanOriginatorId));
      } else {
        router.push(LOAN_ORIGINATOR_LIST_PATH);
      }
      router.refresh();
    });
  }

  const backHref =
    mode === 'edit' && loanOriginatorId != null
      ? loanOriginatorDetailPath(loanOriginatorId)
      : LOAN_ORIGINATOR_LIST_PATH;

  return (
    <ListPage
      title={mode === 'create' ? 'Create loan originator' : 'Edit loan originator'}
      description={
        mode === 'create'
          ? 'Add a loan originator that can be attached to loan accounts.'
          : 'Update loan originator details.'
      }
      backLink={
        <DetailBackLink
          href={backHref}
          label={mode === 'edit' ? 'Back to loan originator' : 'Back to loan originators'}
        />
      }
    >
      <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit}>
        <TextField
          id="loan-originator-name"
          label="Name"
          required
          value={form.name}
          onChange={(value) => updateForm('name', value)}
          error={fieldErrors.name}
          disabled={pending}
        />

        <TextField
          id="loan-originator-external-id"
          label="External ID"
          required={mode === 'create'}
          value={form.externalId}
          onChange={(value) => updateForm('externalId', value)}
          error={fieldErrors.externalId}
          disabled={pending || mode === 'edit'}
          hint={mode === 'edit' ? 'External ID cannot be changed after creation.' : undefined}
        />

        <SelectField
          id="loan-originator-status"
          label="Status"
          required
          value={form.status}
          onValueChange={(value) => updateForm('status', value ?? '')}
          options={statusOptions}
          error={fieldErrors.status}
          disabled={pending}
        />

        <SelectField
          id="loan-originator-type"
          label="Originator type"
          value={form.originatorTypeId}
          onValueChange={(value) => updateForm('originatorTypeId', value ?? '')}
          options={originatorTypeOptions}
          error={fieldErrors.originatorTypeId}
          disabled={pending}
        />

        <SelectField
          id="loan-originator-channel-type"
          label="Channel type"
          value={form.channelTypeId}
          onValueChange={(value) => updateForm('channelTypeId', value ?? '')}
          options={channelTypeOptions}
          error={fieldErrors.channelTypeId}
          disabled={pending}
        />

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create loan originator' : 'Save changes'}
          </Button>
          <Link href={backHref} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
