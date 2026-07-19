'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { useEffect, useId, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { updateGlobalConfigurationValuesAction } from '@/actions/global-configurations';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { globalConfigurationToEditValues } from '@/lib/fineract/global-configuration-display';
import {
  globalConfigurationStringValueField,
  normalizeGlobalConfigurationStringValue
} from '@/lib/fineract/global-configuration-string-options';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';

export function GlobalConfigurationEditSheet({
  open,
  onOpenChange,
  configuration,
  onSaved
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: FineractGlobalConfiguration | null;
  onSaved: () => void;
}) {
  const formId = useId();
  const valueId = useId();
  const stringValueId = useId();
  const dateValueId = useId();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState('');
  const [stringValue, setStringValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !configuration) {
      return;
    }
    const nextValues = globalConfigurationToEditValues(configuration);
    setValue(nextValues.value);
    setStringValue(
      normalizeGlobalConfigurationStringValue(configuration.name, nextValues.stringValue)
    );
    setDateValue(nextValues.dateValue);
    setError(null);
  }, [configuration, open]);

  const stringValueField = globalConfigurationStringValueField(configuration?.name ?? null);

  function handleSubmit() {
    if (!configuration) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateGlobalConfigurationValuesAction({
        id: configuration.id,
        value,
        stringValue,
        dateValue
      });
      if (!result.ok) {

        setError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Configuration updated.', pending: 'Configuration updated sent for approval.' });
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit configuration"
      description={
        configuration
          ? `Update optional values for ${configuration.name}.`
          : 'Update configuration values.'
      }
      formId={formId}
      submitLabel="Save"
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <TextField
          label="Name"
          value={configuration?.name ?? ''}
          onChange={() => undefined}
          disabled
        />
        <TextField
          label="Description"
          value={configuration?.description?.trim() ?? ''}
          onChange={() => undefined}
          multiline
          rows={3}
          disabled
        />
        <TextField
          id={valueId}
          label="Number value"
          type="number"
          value={value}
          onChange={setValue}
          optional
        />
        {stringValueField ? (
          <SelectField
            id={stringValueId}
            label={stringValueField.fieldLabel}
            value={stringValue}
            onValueChange={(next) => setStringValue(next ?? '')}
            options={stringValueField.options.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            placeholder="Select a mode"
            optional
          />
        ) : (
          <TextField
            id={stringValueId}
            label="String value"
            value={stringValue}
            onChange={setStringValue}
            optional
          />
        )}
        <DateField
          id={dateValueId}
          label="Date value"
          value={dateValue}
          onChange={(next) => setDateValue(next ?? '')}
          dateFormat={FINERACT_DATE_FORMAT}
          optional
          allowFuture
        />
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </FormSheet>
  );
}
