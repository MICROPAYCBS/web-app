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
  buildUpsertGlAccountValidationContext,
  glAccountCodeMeetsStructuredRules,
  glAccountStructuredValidationApplies,
  normalizeStructuredGlCodeInput,
  validateUpsertGlAccountForm,
  type UpsertGlAccountFormInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { createGlAccountAction, updateGlAccountAction } from '@/actions/gl-accounts';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormPageFooter } from '@/components/composites/form-page-footer';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  formatGlAccountLabel,
  formatGlAccountTypeLabel,
  GL_ACCOUNT_CODE_NUMBERING_GUIDANCE,
  glAccountCodeHintForType,
  headerOptionsForType,
  structuredGlCodeEnforcementBanner,
  structuredGlCodeLegacyAccountNotice,
  tagOptionsForType
} from '@/lib/accounting/gl-account-display';
import type { StructuredGlCodePolicy } from '@/lib/fineract/gl-account-code-policy-paths';
import { cn } from '@/lib/utils';

export function GlAccountForm({
  mode,
  glAccountId,
  initialValues,
  template,
  structuredGlCodePolicy
}: {
  mode: 'create' | 'edit';
  glAccountId?: number;
  initialValues: UpsertGlAccountFormInput;
  template: FineractGlAccountFormTemplate;
  structuredGlCodePolicy: StructuredGlCodePolicy;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UpsertGlAccountFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const originalValuesRef = useRef({
    glCode: initialValues.glCode,
    type: initialValues.type,
    parentId: initialValues.parentId
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parentAccounts = useMemo(
    () => headerOptionsForType(template, form.type),
    [template, form.type]
  );

  const parentOptions = useMemo(
    () =>
      parentAccounts.map((account) => ({
        value: String(account.id),
        label: formatGlAccountLabel(account),
        keywords: [account.glCode, account.name]
      })),
    [parentAccounts]
  );

  const selectedParent = useMemo(() => {
    if (form.parentId == null) {
      return undefined;
    }
    return parentAccounts.find((account) => account.id === form.parentId);
  }, [form.parentId, parentAccounts]);

  const selectedParentGlCode = selectedParent?.glCode;
  const selectedParentName = selectedParent?.name;
  const selectedParentTypeId = selectedParent?.type?.id;

  const structuredValidationActive = useMemo(() => {
    if (!structuredGlCodePolicy.enforceStructured) {
      return false;
    }
    if (mode === 'create') {
      return true;
    }
    return glAccountStructuredValidationApplies(form, originalValuesRef.current);
  }, [form, mode, structuredGlCodePolicy.enforceStructured]);

  const validationContext = useMemo(
    () =>
      buildUpsertGlAccountValidationContext(structuredGlCodePolicy, {
        parentGlCode: selectedParentGlCode,
        parentTypeId: selectedParentTypeId,
        original: mode === 'edit' ? originalValuesRef.current : undefined
      }),
    [mode, selectedParentGlCode, selectedParentTypeId, structuredGlCodePolicy]
  );

  const showLegacyGlCodeNotice = useMemo(() => {
    if (mode !== 'edit' || !structuredGlCodePolicy.enforceStructured || structuredValidationActive) {
      return false;
    }
    return !glAccountCodeMeetsStructuredRules(form.glCode, form.type, {
      codeLength: structuredGlCodePolicy.codeLength,
      parentGlCode: selectedParentGlCode
    });
  }, [
    form.glCode,
    form.type,
    mode,
    selectedParentGlCode,
    structuredGlCodePolicy.codeLength,
    structuredGlCodePolicy.enforceStructured,
    structuredValidationActive
  ]);

  const syncFieldErrors = useCallback(
    (nextForm: UpsertGlAccountFormInput, fields: Array<'glCode' | 'parentId' | 'tagId'>) => {
      const parsed = validateUpsertGlAccountForm(nextForm, validationContext);
      if (parsed.success) {
        setFieldErrors((current) => {
          const next = { ...current };
          for (const field of fields) {
            delete next[field];
          }
          return next;
        });
        return;
      }

      const nextFieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (fields.includes(key as (typeof fields)[number]) && !nextFieldErrors[key]) {
          nextFieldErrors[key] = issue.message;
        }
      }

      setFieldErrors((current) => {
        const next = { ...current };
        for (const field of fields) {
          if (nextFieldErrors[field]) {
            next[field] = nextFieldErrors[field];
          } else {
            delete next[field];
          }
        }
        return next;
      });
    },
    [validationContext]
  );

  const glCodeHintOptions = useMemo(
    () => ({
      enforceStructured: structuredGlCodePolicy.enforceStructured && structuredValidationActive,
      codeLength: structuredGlCodePolicy.codeLength,
      parentGlCode: selectedParentGlCode,
      parentName: selectedParentName
    }),
    [
      structuredGlCodePolicy,
      structuredValidationActive,
      selectedParentGlCode,
      selectedParentName
    ]
  );

  const tagOptions = useMemo(
    () =>
      tagOptionsForType(template, form.type).map((tag) => ({
        value: String(tag.id),
        label: tag.name ?? tag.value ?? String(tag.id)
      })),
    [template, form.type]
  );

  function patchForm(
    patch: Partial<UpsertGlAccountFormInput>,
    options?: { validateFields?: Array<'glCode' | 'parentId' | 'tagId'> }
  ) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertGlAccountFormInput;
      formRef.current = next;
      if (options?.validateFields?.length) {
        syncFieldErrors(next, options.validateFields);
      }
      return next;
    });
  }

  function handleTypeChange(value: string | undefined) {
    if (!value) {
      return;
    }
    patchForm(
      {
        type: Number(value),
        parentId: undefined,
        tagId: undefined
      },
      { validateFields: ['glCode'] }
    );
  }

  function handleGlCodeChange(value: string) {
    const nextValue =
      structuredValidationActive
        ? normalizeStructuredGlCodeInput(value, structuredGlCodePolicy.codeLength)
        : value;
    patchForm({ glCode: nextValue });
  }

  function handleGlCodeBlur() {
    syncFieldErrors(formRef.current, ['glCode']);
  }

  function handleParentChange(value: string | undefined) {
    patchForm(
      { parentId: value ? Number(value) : undefined },
      { validateFields: ['glCode', 'parentId'] }
    );
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertGlAccountForm(formRef.current, validationContext);
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
        return;
      }
      toastCommandOutcome(result, {
        completed: mode === 'create' ? 'GL account created.' : 'GL account updated.',
        pending:
          mode === 'create'
            ? 'GL account created. Sent for approval.'
            : 'GL account updated. Sent for approval.'
      });
      router.push(`/accounting/chart-of-accounts/${result.resourceId ?? glAccountId}`);
      router.refresh();
    });
  }

  const cancelHref =
    mode === 'edit' && glAccountId != null
      ? `/accounting/chart-of-accounts/${glAccountId}`
      : '/accounting/chart-of-accounts';

  return (
    <form
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="space-y-8 p-6">
        {structuredGlCodePolicy.enforceStructured && structuredValidationActive ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {structuredGlCodeEnforcementBanner(structuredGlCodePolicy.codeLength)}
          </p>
        ) : mode === 'create' ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {GL_ACCOUNT_CODE_NUMBERING_GUIDANCE}
          </p>
        ) : null}

        {showLegacyGlCodeNotice ? (
          <p
            className={cn(
              'rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground'
            )}
          >
            {structuredGlCodeLegacyAccountNotice()}
          </p>
        ) : null}

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
          onChange={handleGlCodeChange}
          onBlur={handleGlCodeBlur}
          disabled={pending}
          error={fieldErrors.glCode}
          hint={glAccountCodeHintForType(form.type, glCodeHintOptions)}
          inputMode={structuredValidationActive ? 'numeric' : undefined}
          maxLength={structuredValidationActive ? structuredGlCodePolicy.codeLength : undefined}
        />
        <SelectField
          label="Parent"
          optional
          value={form.parentId != null ? String(form.parentId) : undefined}
          onValueChange={handleParentChange}
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
        submitError === 'Fix the highlighted fields.' ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : (
          <FineractErrorAlert message={submitError} />
        )
      ) : null}
      </div>

      <FormPageFooter
        cancelHref={cancelHref}
        submitLabel={mode === 'create' ? 'Create account' : 'Save changes'}
        submitLoading={pending}
        submitLoadingLabel="Saving…"
      />
    </form>
  );
}
