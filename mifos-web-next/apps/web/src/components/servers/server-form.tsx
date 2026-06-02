'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ServerActionResult } from '@/actions/servers';

export interface ServerFormValues {
  name: string;
  baseUrl: string;
  tenantId: string;
}

type ServerFormField = keyof ServerFormValues;

type ServerFormFieldErrors = Partial<Record<ServerFormField, string>>;

const DEFAULT_VALUES: ServerFormValues = {
  name: '',
  baseUrl: '',
  tenantId: 'default'
};

const REQUIRED_FIELD_MESSAGE = 'This field is required';

function validateServerFormValues(values: ServerFormValues): ServerFormFieldErrors {
  const errors: ServerFormFieldErrors = {};
  if (!values.name.trim()) {
    errors.name = REQUIRED_FIELD_MESSAGE;
  }
  if (!values.baseUrl.trim()) {
    errors.baseUrl = REQUIRED_FIELD_MESSAGE;
  }
  if (!values.tenantId.trim()) {
    errors.tenantId = REQUIRED_FIELD_MESSAGE;
  }
  return errors;
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

export function ServerForm({
  initialValues = DEFAULT_VALUES,
  submitLabel,
  onSubmit
}: {
  initialValues?: ServerFormValues;
  submitLabel: string;
  onSubmit: (values: ServerFormValues) => Promise<ServerActionResult>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ServerFormFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearFieldError(field: ServerFormField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextFieldErrors = validateServerFormValues(values);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const result = await onSubmit({
        name: values.name.trim(),
        baseUrl: values.baseUrl.trim(),
        tenantId: values.tenantId.trim()
      });
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-4">
        <FieldDescription>All fields are required.</FieldDescription>

        <Field data-invalid={fieldErrors.name ? true : undefined}>
          <FieldLabel htmlFor="server-name">
            Name <RequiredMark />
          </FieldLabel>
          <Input
            id="server-name"
            placeholder="Production, Sandbox, Local…"
            value={values.name}
            onChange={(e) => {
              clearFieldError('name');
              setValues((v) => ({ ...v, name: e.target.value }));
            }}
            required
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'server-name-error' : undefined}
          />
          <FieldError id="server-name-error">{fieldErrors.name}</FieldError>
        </Field>

        <Field data-invalid={fieldErrors.baseUrl ? true : undefined}>
          <FieldLabel htmlFor="server-url">
            Server URL <RequiredMark />
          </FieldLabel>
          <Input
            id="server-url"
            placeholder="https://my-server.org"
            value={values.baseUrl}
            onChange={(e) => {
              clearFieldError('baseUrl');
              setValues((v) => ({ ...v, baseUrl: e.target.value }));
            }}
            required
            autoComplete="off"
            aria-invalid={!!fieldErrors.baseUrl}
            aria-describedby={
              fieldErrors.baseUrl ? 'server-url-error' : 'server-url-hint'
            }
          />
          <FieldDescription id="server-url-hint">
            Hostname only, or include the full API path (e.g. …/api/v1).
          </FieldDescription>
          <FieldError id="server-url-error">{fieldErrors.baseUrl}</FieldError>
        </Field>

        <Field data-invalid={fieldErrors.tenantId ? true : undefined}>
          <FieldLabel htmlFor="server-tenant">
            Tenant <RequiredMark />
          </FieldLabel>
          <Input
            id="server-tenant"
            placeholder="default"
            value={values.tenantId}
            onChange={(e) => {
              clearFieldError('tenantId');
              setValues((v) => ({ ...v, tenantId: e.target.value }));
            }}
            required
            aria-invalid={!!fieldErrors.tenantId}
            aria-describedby={fieldErrors.tenantId ? 'server-tenant-error' : undefined}
          />
          <FieldError id="server-tenant-error">{fieldErrors.tenantId}</FieldError>
        </Field>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
