'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  EntityMappingFilterOptions,
  FineractEntityMappingDetail,
  FineractEntityMappingType
} from '@mifos/api-client';
import { validateUpsertEntityMapping, type UpsertEntityMappingInput } from '@mifos/validation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createEntityMappingAction,
  updateEntityMappingAction
} from '@/actions/entity-to-entity-mapping';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { entityMappingDetailToFormValues } from '@/lib/fineract/entity-mapping-display';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

function defaultFormValues(): UpsertEntityMappingInput {
  return {
    fromId: 0,
    toId: 0,
    startDate: undefined,
    endDate: undefined,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

function toSelectOptions(options: EntityMappingFilterOptions['fromOptions']) {
  return options.map((option) => ({
    value: String(option.id),
    label: option.name
  }));
}

export function EntityToEntityMappingFormSheet({
  open,
  onOpenChange,
  mappingTypeId,
  filterOptions,
  mapId,
  initialDetail,
  onSaved
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappingTypeId: number;
  filterOptions: EntityMappingFilterOptions;
  mapId?: number;
  initialDetail?: FineractEntityMappingDetail | null;
  onSaved: () => void;
}) {
  const formId = useId();
  const isEdit = mapId != null;
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<UpsertEntityMappingInput>(() => defaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const resetValues = useMemo((): UpsertEntityMappingInput => {
    if (initialDetail) {
      const values = entityMappingDetailToFormValues(
        initialDetail,
        FINERACT_DATE_FORMAT,
        FINERACT_LOCALE
      );
      return {
        ...values,
        fromId: values.fromId ?? 0,
        toId: values.toId ?? 0
      };
    }
    return defaultFormValues();
  }, [initialDetail]);

  useEffect(() => {
    if (open) {
      setForm(resetValues);
      setFieldErrors({});
      setError(null);
    }
  }, [open, resetValues]);

  function handleSubmit() {
    setError(null);
    const parsed = validateUpsertEntityMapping(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateEntityMappingAction(mapId, parsed.data)
        : await createEntityMappingAction(mappingTypeId, parsed.data);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.message);
        return;
      }
      toast.success(isEdit ? 'Mapping updated.' : 'Mapping created.');
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit mapping' : 'Add mapping'}
      description={`${filterOptions.fromLabel} access to ${filterOptions.toLabel.toLowerCase()}.`}
      formId={formId}
      submitLabel={isEdit ? 'Save changes' : 'Add mapping'}
      onSubmit={handleSubmit}
      submitLoading={pending}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <SelectField
          label={filterOptions.fromLabel}
          required
          value={form.fromId ? String(form.fromId) : undefined}
          onValueChange={(value) => {
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.fromId;
              return next;
            });
            setForm((current) => ({
              ...current,
              fromId: value ? Number(value) : 0
            }));
          }}
          options={toSelectOptions(filterOptions.fromOptions)}
          placeholder={`Select ${filterOptions.fromLabel.toLowerCase()}`}
          error={fieldErrors.fromId}
        />
        <SelectField
          label={filterOptions.toLabel}
          required
          value={form.toId ? String(form.toId) : undefined}
          onValueChange={(value) => {
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.toId;
              return next;
            });
            setForm((current) => ({
              ...current,
              toId: value ? Number(value) : 0
            }));
          }}
          options={toSelectOptions(filterOptions.toOptions)}
          placeholder={`Select ${filterOptions.toLabel.toLowerCase()}`}
          error={fieldErrors.toId}
        />
        <DateField
          label="Start date"
          optional
          value={form.startDate}
          onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
          dateFormat={FINERACT_DATE_FORMAT}
          allowFuture
        />
        <DateField
          label="End date"
          optional
          value={form.endDate}
          onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
          dateFormat={FINERACT_DATE_FORMAT}
          allowFuture
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </FormSheet>
  );
}
