'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookTemplate, FineractHookTemplateName } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertHookForm,
  type UpsertHookFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createHookAction, updateHookAction } from '@/actions/hooks';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { HookEventsEditor } from '@/components/system/hook-events-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { defaultHookFormValues, hookTemplateLabel } from '@/lib/fineract/hook-display';
import { cn } from '@/lib/utils';

function isHookTemplateName(value: string): value is FineractHookTemplateName {
  return value === 'Web' || value === 'SMS Bridge';
}

export function HookForm({
  mode,
  hookId,
  initialValues,
  template,
  templateLocked = false
}: {
  mode: 'create' | 'edit';
  hookId?: number;
  initialValues: UpsertHookFormInput;
  template: FineractHookTemplate;
  templateLocked?: boolean;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<UpsertHookFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const templateOptions = (template.templates ?? [])
    .map((item) => item.name)
    .filter(isHookTemplateName)
    .map((name) => ({
      value: name,
      label: hookTemplateLabel(name)
    }));

  function patchForm(patch: Partial<UpsertHookFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertHookFormInput;
      formRef.current = next;
      return next;
    });
  }

  function clearEventsFieldErrors() {
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (key === 'events' || key.startsWith('events.')) {
          delete next[key];
        }
      }
      return next;
    });
    setSubmitError(null);
  }

  function setEvents(events: UpsertHookFormInput['events']) {
    setForm((current) => {
      const next = { ...current, events } as UpsertHookFormInput;
      formRef.current = next;
      return next;
    });
    clearEventsFieldErrors();
  }

  function handleTemplateChange(nextTemplate: string | undefined) {
    if (!nextTemplate || !isHookTemplateName(nextTemplate) || templateLocked) {
      return;
    }
    const preserved = {
      displayName: form.displayName,
      isActive: form.isActive,
      events: form.events
    };
    setForm({
      ...defaultHookFormValues(nextTemplate),
      ...preserved
    } as UpsertHookFormInput);
    formRef.current = {
      ...defaultHookFormValues(nextTemplate),
      ...preserved
    } as UpsertHookFormInput;
    setFieldErrors({});
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertHookForm(formRef.current);
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
          ? await createHookAction(parsed.data)
          : await updateHookAction(hookId as number, parsed.data);

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      if (mode === 'create' && result.resourceId != null) {
        router.push(`/system/hooks/${result.resourceId}`);
      } else if (hookId != null) {
        router.push(`/system/hooks/${hookId}`);
      } else {
        router.push('/system/hooks');
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Hook created.' : 'Hook updated.', pending: mode === 'create' ? 'Hook created. sent for approval.' : 'Hook updated. sent for approval.' });
      router.refresh();
    });
  }

  return (
    <form
      id={formId}
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Hook template"
          required
          value={form.name}
          onValueChange={handleTemplateChange}
          options={templateOptions}
          disabled={templateLocked || pending}
          error={fieldErrors.name}
        />
        <TextField
          label="Display name"
          required
          value={form.displayName}
          onChange={(value) => patchForm({ displayName: value })}
          disabled={pending}
          error={fieldErrors.displayName}
        />
      </div>

      {form.name === 'Web' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Content type"
            required
            value={form.contentType}
            onValueChange={(value) => {
              if (value === 'json' || value === 'form') {
                patchForm({ name: 'Web', contentType: value });
              }
            }}
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'form', label: 'Form' }
            ]}
            disabled={pending}
            error={fieldErrors.contentType}
          />
          <TextField
            label="Payload URL"
            required
            value={form.payloadUrl}
            onChange={(value) => patchForm({ name: 'Web', payloadUrl: value })}
            disabled={pending}
            error={fieldErrors.payloadUrl}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Phone number"
              required
              value={form.phoneNumber}
              onChange={(value) => patchForm({ name: 'SMS Bridge', phoneNumber: value })}
              disabled={pending}
              error={fieldErrors.phoneNumber}
            />
            <TextField
              label="Payload URL"
              required
              value={form.payloadUrl}
              onChange={(value) => patchForm({ name: 'SMS Bridge', payloadUrl: value })}
              disabled={pending}
              error={fieldErrors.payloadUrl}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              label="SMS provider"
              required
              value={form.smsProvider}
              onChange={(value) => patchForm({ name: 'SMS Bridge', smsProvider: value })}
              disabled={pending}
              error={fieldErrors.smsProvider}
            />
            <TextField
              label="SMS provider account ID"
              required
              value={form.smsProviderAccountId}
              onChange={(value) => patchForm({ name: 'SMS Bridge', smsProviderAccountId: value })}
              disabled={pending}
              error={fieldErrors.smsProviderAccountId}
            />
            <TextField
              label="SMS provider token"
              required
              value={form.smsProviderToken}
              onChange={(value) => patchForm({ name: 'SMS Bridge', smsProviderToken: value })}
              disabled={pending}
              error={fieldErrors.smsProviderToken}
            />
          </div>
        </>
      )}

      <Field orientation="horizontal" className="items-center gap-3">
        <Checkbox
          id={`${formId}-is-active`}
          checked={form.isActive}
          onCheckedChange={(checked) => patchForm({ isActive: checked === true })}
          disabled={pending}
        />
        <FieldContent>
          <FieldLabel htmlFor={`${formId}-is-active`}>Active</FieldLabel>
        </FieldContent>
      </Field>

      <HookEventsEditor
        events={form.events}
        onChange={setEvents}
        template={template}
        error={fieldErrors.events}
      />

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create hook' : 'Save changes'}
        </Button>
        <Link
          href={mode === 'edit' && hookId != null ? `/system/hooks/${hookId}` : '/system/hooks'}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
