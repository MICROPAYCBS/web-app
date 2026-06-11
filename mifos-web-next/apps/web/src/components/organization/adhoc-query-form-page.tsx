'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';
import { ADHOC_QUERY_CUSTOM_FREQUENCY_ID } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { createAdhocQueryAction, updateAdhocQueryAction } from '@/actions/adhoc-query';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ADHOC_QUERY_LIST_PATH,
  adhocQueryDetailPath
} from '@/lib/fineract/adhoc-query-paths';
import { toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';

type AdhocQueryFormState = {
  name: string;
  query: string;
  tableName: string;
  tableFields: string;
  email: string;
  reportRunFrequency: string;
  reportRunEvery: string;
  isActive: boolean;
};

function defaultFormState(): AdhocQueryFormState {
  return {
    name: '',
    query: '',
    tableName: '',
    tableFields: '',
    email: '',
    reportRunFrequency: '',
    reportRunEvery: '',
    isActive: false
  };
}

function formStateFromInitial(initial?: Partial<AdhocQueryFormState>): AdhocQueryFormState {
  if (!initial) {
    return defaultFormState();
  }
  return {
    ...defaultFormState(),
    ...initial,
    reportRunFrequency:
      initial.reportRunFrequency != null && initial.reportRunFrequency !== ''
        ? String(initial.reportRunFrequency)
        : '',
    reportRunEvery:
      initial.reportRunEvery != null && initial.reportRunEvery !== ''
        ? String(initial.reportRunEvery)
        : ''
  };
}

export function AdhocQueryFormPage({
  mode,
  adhocQueryId,
  reportRunFrequencies,
  initial
}: {
  mode: 'create' | 'edit';
  adhocQueryId?: number;
  reportRunFrequencies: FineractEnumOption[];
  initial?: Partial<AdhocQueryFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdhocQueryFormState>(() => formStateFromInitial(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const frequencyOptions = useMemo(
    () => toSelectOptions(reportRunFrequencies),
    [reportRunFrequencies]
  );

  const showCustomFrequency =
    Number(form.reportRunFrequency) === ADHOC_QUERY_CUSTOM_FREQUENCY_ID;

  function updateForm<K extends keyof AdhocQueryFormState>(
    key: K,
    value: AdhocQueryFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      name: form.name,
      query: form.query,
      tableName: form.tableName,
      tableFields: form.tableFields,
      email: form.email || undefined,
      reportRunFrequency: form.reportRunFrequency || undefined,
      reportRunEvery: showCustomFrequency ? Number(form.reportRunEvery) : undefined,
      isActive: form.isActive
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createAdhocQueryAction(payload)
          : await updateAdhocQueryAction(String(adhocQueryId), payload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      if (mode === 'create' && result.adhocQueryId != null) {
        router.push(adhocQueryDetailPath(result.adhocQueryId));
      } else if (adhocQueryId != null) {
        router.push(adhocQueryDetailPath(adhocQueryId));
      } else {
        router.push(ADHOC_QUERY_LIST_PATH);
      }
      router.refresh();
    });
  }

  const backHref =
    mode === 'edit' && adhocQueryId != null
      ? adhocQueryDetailPath(adhocQueryId)
      : ADHOC_QUERY_LIST_PATH;

  return (
    <ListPage
      title={mode === 'create' ? 'Create ad hoc query' : 'Edit ad hoc query'}
      description="Define a SQL query, target table, and optional scheduled report delivery."
      backLink={
        <DetailBackLink
          href={backHref}
          label={mode === 'edit' ? 'Back to ad hoc query' : 'Back to ad hoc queries'}
        />
      }
    >
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <TextField
          id="adhoc-query-name"
          label="Name"
          required
          value={form.name}
          onChange={(value) => updateForm('name', value)}
          error={fieldErrors.name}
        />

        <div className="space-y-2">
          <Label htmlFor="adhoc-query-sql">
            SQL query <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="adhoc-query-sql"
            value={form.query}
            onChange={(event) => updateForm('query', event.target.value)}
            rows={5}
            className="font-mono text-sm"
            required
          />
          {fieldErrors.query ? (
            <p className="text-sm text-destructive">{fieldErrors.query}</p>
          ) : null}
        </div>

        <TextField
          id="adhoc-query-table-name"
          label="Insert into table"
          required
          value={form.tableName}
          onChange={(value) => updateForm('tableName', value)}
          error={fieldErrors.tableName}
        />

        <div className="space-y-2">
          <Label htmlFor="adhoc-query-table-fields">
            Table fields <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="adhoc-query-table-fields"
            value={form.tableFields}
            onChange={(event) => updateForm('tableFields', event.target.value)}
            rows={4}
            className="font-mono text-sm"
            required
          />
          {fieldErrors.tableFields ? (
            <p className="text-sm text-destructive">{fieldErrors.tableFields}</p>
          ) : null}
        </div>

        <TextField
          id="adhoc-query-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => updateForm('email', value)}
          error={fieldErrors.email}
        />

        <SelectField
          id="adhoc-query-frequency"
          label="Report run frequency"
          value={form.reportRunFrequency}
          onValueChange={(value) => updateForm('reportRunFrequency', value ?? '')}
          options={[{ value: '', label: 'None' }, ...frequencyOptions]}
          error={fieldErrors.reportRunFrequency}
        />

        {showCustomFrequency ? (
          <TextField
            id="adhoc-query-frequency-days"
            label="Custom report run frequency (days)"
            type="number"
            required
            value={form.reportRunEvery}
            onChange={(value) => updateForm('reportRunEvery', value)}
            error={fieldErrors.reportRunEvery}
          />
        ) : null}

        <div className="flex items-center gap-2">
          <Checkbox
            id="adhoc-query-active"
            checked={form.isActive}
            onCheckedChange={(checked) => updateForm('isActive', checked === true)}
          />
          <Label htmlFor="adhoc-query-active">Active</Label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create ad hoc query' : 'Save changes'}
          </Button>
          <Link href={backHref} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
