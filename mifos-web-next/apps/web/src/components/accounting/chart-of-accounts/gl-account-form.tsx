'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountFormTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertGlAccountForm,
  type UpsertGlAccountFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createGlAccountAction, updateGlAccountAction } from '@/actions/gl-accounts';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  formatGlAccountLabel,
  formatGlAccountTypeLabel,
  headerOptionsForType,
  tagOptionsForType
} from '@/lib/accounting/gl-account-display';
import { cn } from '@/lib/utils';

export function GlAccountForm({
  mode,
  glAccountId,
  initialValues,
  template
}: {
  mode: 'create' | 'edit';
  glAccountId?: number;
  initialValues: UpsertGlAccountFormInput;
  template: FineractGlAccountFormTemplate;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UpsertGlAccountFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parentOptions = useMemo(
    () =>
      headerOptionsForType(template, form.type).map((account) => ({
        value: String(account.id),
        label: formatGlAccountLabel(account),
        keywords: [account.glCode, account.name]
      })),
    [template, form.type]
  );

  const tagOptions = useMemo(
    () =>
      tagOptionsForType(template, form.type).map((tag) => ({
        value: String(tag.id),
        label: tag.name ?? tag.value ?? String(tag.id)
      })),
    [template, form.type]
  );

  function patchForm(patch: Partial<UpsertGlAccountFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertGlAccountFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleTypeChange(value: string | undefined) {
    if (!value) {
      return;
    }
    patchForm({
      type: Number(value),
      parentId: undefined,
      tagId: undefined
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertGlAccountForm(formRef.current);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createGlAccountAction(parsed.data)
          : await updateGlAccountAction(glAccountId as number, parsed.data);

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'GL account created.' : 'GL account updated.', pending: mode === 'create' ? 'GL account created. sent for approval.' : 'GL account updated. sent for approval.' });
      router.push(`/accounting/chart-of-accounts/${result.resourceId ?? glAccountId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Account type"
          required
          value={String(form.type)}
          onValueChange={handleTypeChange}
          options={template.accountTypeOptions.map((option) => ({
            value: String(option.id),
            label: formatGlAccountTypeLabel(option)
          }))}
          disabled={pending || mode === 'edit'}
          error={fieldErrors.type}
        />
        <TextField
          label="Account name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          disabled={pending}
          error={fieldErrors.name}
        />
        <SelectField
          label="Account usage"
          required
          value={String(form.usage)}
          onValueChange={(value) => {
            if (value) {
              patchForm({ usage: Number(value) });
            }
          }}
          options={template.usageOptions.map((option) => ({
            value: String(option.id),
            label: option.value || String(option.id)
          }))}
          disabled={pending}
          error={fieldErrors.usage}
        />
        <TextField
          label="GL code"
          required
          value={form.glCode}
          onChange={(value) => patchForm({ glCode: value })}
          disabled={pending}
          error={fieldErrors.glCode}
        />
        <SelectField
          label="Parent"
          optional
          value={form.parentId != null ? String(form.parentId) : undefined}
          onValueChange={(value) => patchForm({ parentId: value ? Number(value) : undefined })}
          options={parentOptions}
          disabled={pending || parentOptions.length === 0}
          error={fieldErrors.parentId}
          placeholder="No parent"
        />
        <SelectField
          label="Tag"
          optional
          value={form.tagId != null ? String(form.tagId) : undefined}
          onValueChange={(value) => patchForm({ tagId: value ? Number(value) : undefined })}
          options={tagOptions}
          disabled={pending || tagOptions.length === 0}
          error={fieldErrors.tagId}
          placeholder="No tag"
        />
      </div>

      <Field orientation="horizontal" className="items-center gap-3">
        <Checkbox
          checked={form.manualEntriesAllowed}
          onCheckedChange={(checked) => patchForm({ manualEntriesAllowed: checked === true })}
          disabled={pending}
        />
        <FieldContent>
          <FieldLabel>Manual entries allowed</FieldLabel>
        </FieldContent>
      </Field>

      <TextField
        label="Description"
        optional
        multiline
        rows={3}
        value={form.description ?? ''}
        onChange={(value) => patchForm({ description: value })}
        disabled={pending}
        error={fieldErrors.description}
      />

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create account' : 'Save changes'}
        </Button>
        <Link
          href={
            mode === 'edit' && glAccountId != null
              ? `/accounting/chart-of-accounts/${glAccountId}`
              : '/accounting/chart-of-accounts'
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
