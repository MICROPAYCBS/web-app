'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceProperty } from '@mifos/api-client';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateExternalServiceAction } from '@/actions/external-services';
import { FormSheet } from '@/components/composites/form-sheet';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import {
  type ExternalServiceDefinition,
  propertiesToFormValues
} from '@/lib/fineract/external-service-display';

export function ExternalServiceEditSheet({
  open,
  onOpenChange,
  definition,
  properties,
  onSaved
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: ExternalServiceDefinition;
  properties: FineractExternalServiceProperty[];
  onSaved: () => void;
}) {
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initialValues = useMemo(
    () => propertiesToFormValues(definition, properties),
    [definition, properties]
  );
  const [values, setValues] = useState<Record<string, string | boolean>>(initialValues);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues(propertiesToFormValues(definition, properties));
    setError(null);
  }, [definition, open, properties]);

  const isValid = definition.fields.every((field) => {
    const value = values[field.key];
    if (field.type === 'boolean') {
      return typeof value === 'boolean';
    }
    return typeof value === 'string' && value.trim().length > 0;
  });

  function setFieldValue(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await updateExternalServiceAction(definition.slug, values);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(`${definition.title} updated.`);
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${definition.title}`}
      description="Update connection settings for this integration."
      formId={formId}
      submitLabel="Save"
      submitDisabled={!isValid}
      submitLoading={pending}
      onCancel={() => setValues(initialValues)}
      onSubmit={handleSubmit}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {definition.fields.map((field) => {
          if (field.type === 'boolean') {
            return (
              <SwitchField
                key={field.key}
                label={field.label}
                checked={values[field.key] === true}
                onCheckedChange={(checked) => setFieldValue(field.key, checked)}
                required
              />
            );
          }

          return (
            <TextField
              key={field.key}
              label={field.label}
              required
              type={
                field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'
              }
              value={typeof values[field.key] === 'string' ? (values[field.key] as string) : ''}
              onChange={(value) => setFieldValue(field.key, value)}
            />
          );
        })}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
