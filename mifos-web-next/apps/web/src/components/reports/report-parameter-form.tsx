'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunParameter } from '@mifos/api-client';
import { isReportParameterDate, isReportParameterSelect } from '@mifos/domain';
import { useMemo, useState } from 'react';
import { DateField } from '@/components/composites/date-field';
import { ReportParameterSelect } from '@/components/reports/report-parameter-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { dateToFineract, fineractDateToDate, isoDateToFineract } from '@/lib/fineract/date-input';

function formatReportDateValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isoDateToFineract(trimmed);
  }
  const parsed = fineractDateToDate(trimmed);
  return parsed ? (dateToFineract(parsed) ?? trimmed) : trimmed;
}

export function ReportParameterForm({
  formId,
  parameters,
  disabled = false,
  onSubmit
}: {
  formId: string;
  parameters: FineractReportRunParameter[];
  disabled?: boolean;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    for (const parameter of parameters) {
      const fieldName = parameter.parameterVariable || parameter.parameterName;
      if (parameter.parameterType === 'checkbox') {
        initial[fieldName] = false;
      } else if (parameter.defaultVal) {
        initial[fieldName] = parameter.defaultVal;
      } else {
        initial[fieldName] = '';
      }
    }
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const variableByParameterName = useMemo(
    () =>
      parameters.reduce<Record<string, string>>((acc, parameter) => {
        acc[parameter.parameterName] = parameter.parameterVariable || parameter.parameterName;
        return acc;
      }, {}),
    [parameters]
  );

  function setFieldValue(fieldName: string, value: string | boolean) {
    setValues((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const formatted: Record<string, string> = {};

    for (const parameter of parameters) {
      const fieldName = parameter.parameterVariable || parameter.parameterName;
      const label = parameter.parameterLabel || parameter.parameterName;
      const raw = values[fieldName];
      const isDate = isReportParameterDate(parameter);
      const isCheckbox = parameter.parameterType === 'checkbox';

      if (isCheckbox) {
        formatted[fieldName] = raw === true ? 'true' : 'false';
        continue;
      }

      const stringValue = String(raw ?? '').trim();
      if (!stringValue) {
        nextErrors[fieldName] = `${label} is required.`;
        continue;
      }

      formatted[fieldName] = isDate ? formatReportDateValue(stringValue) : stringValue;
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    onSubmit(formatted);
  }

  if (!parameters.length) {
    return (
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({});
        }}
      >
        <p className="text-sm text-muted-foreground">This report has no parameters.</p>
      </form>
    );
  }

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
      {parameters.map((parameter) => {
        const fieldName = parameter.parameterVariable || parameter.parameterName;
        const label = parameter.parameterLabel || parameter.parameterName;
        const isSelect = isReportParameterSelect(parameter);
        const isDate = isReportParameterDate(parameter);
        const isCheckbox = parameter.parameterType === 'checkbox';
        const parentFieldName = parameter.parentParameterName
          ? variableByParameterName[parameter.parentParameterName]
          : undefined;
        const parentValue = parentFieldName ? String(values[parentFieldName] ?? '') : undefined;

        return (
          <div key={`${parameter.parameterName}-${fieldName}`} className="space-y-2">
            {isSelect ? (
              <ReportParameterSelect
                id={fieldName}
                label={label}
                parameterReportName={parameter.parameterName}
                value={String(values[fieldName] ?? '') || undefined}
                onValueChange={(value) => setFieldValue(fieldName, value ?? '')}
                parentVariable={parentFieldName}
                parentValue={parentValue}
                disabled={disabled}
                error={fieldErrors[fieldName]}
                placeholder={`Select ${label}`}
              />
            ) : isDate ? (
              <DateField
                id={fieldName}
                label={label}
                required
                value={String(values[fieldName] ?? '') || undefined}
                onChange={(value) => setFieldValue(fieldName, value ?? '')}
                disabled={disabled}
                error={fieldErrors[fieldName]}
                allowFuture
              />
            ) : isCheckbox ? (
              <Field orientation="horizontal" className="items-center gap-3">
                <Checkbox
                  id={fieldName}
                  checked={values[fieldName] === true}
                  onCheckedChange={(checked) => setFieldValue(fieldName, checked === true)}
                  disabled={disabled}
                />
                <FieldContent>
                  <FieldLabel htmlFor={fieldName}>{label}</FieldLabel>
                </FieldContent>
              </Field>
            ) : (
              <>
                <FieldLabel htmlFor={fieldName}>{label}</FieldLabel>
                <Input
                  id={fieldName}
                  value={String(values[fieldName] ?? '')}
                  onChange={(event) => setFieldValue(fieldName, event.target.value)}
                  disabled={disabled}
                  placeholder={label}
                />
              </>
            )}
            {!isSelect && !isDate && fieldErrors[fieldName] ? (
              <p className="text-sm text-destructive">{fieldErrors[fieldName]}</p>
            ) : null}
          </div>
        );
      })}
    </form>
  );
}
