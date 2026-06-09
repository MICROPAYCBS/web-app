'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { useMemo } from 'react';
import { DateField } from '@/components/composites/date-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  filterSystemColumns,
  getDatatableControlName,
  isDateColumn,
  isNumericColumn,
  toDatatableDisplayLabel
} from '@/lib/fineract/datatables';

export function DatatableFields({
  columns,
  values,
  errors,
  onChange
}: {
  columns: FineractDatatableColumnHeader[];
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  const visibleColumns = useMemo(() => filterSystemColumns(columns), [columns]);

  function setValue(controlName: string, value: unknown) {
    onChange({ ...values, [controlName]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visibleColumns.map((column) => {
        const controlName = getDatatableControlName(column);
        const label = toDatatableDisplayLabel(column.columnName);
        const required = !column.isColumnNullable;
        const error = errors?.[controlName];

        if (column.columnDisplayType === 'BOOLEAN') {
          return (
            <Field key={column.columnName} className="flex flex-row items-center gap-2">
              <Checkbox
                id={controlName}
                checked={values[controlName] === true}
                onCheckedChange={(checked) => setValue(controlName, checked === true)}
              />
              <Label htmlFor={controlName} className="font-normal">
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
                {!required ? <span className="text-muted-foreground"> (optional)</span> : null}
              </Label>
              {error ? <p className="text-xs text-destructive sm:col-span-2">{error}</p> : null}
            </Field>
          );
        }

        if (column.columnDisplayType === 'CODELOOKUP') {
          return (
            <SelectField
              key={column.columnName}
              id={controlName}
              label={label}
              required={required}
              optional={!required}
              value={values[controlName] != null ? String(values[controlName]) : undefined}
              onValueChange={(value) => setValue(controlName, value ? Number(value) : undefined)}
              options={
                column.columnValues?.map((option) => ({
                  value: String(option.id),
                  label: option.value
                })) ?? []
              }
              error={error}
            />
          );
        }

        if (isDateColumn(column.columnDisplayType)) {
          return (
            <DateField
              key={column.columnName}
              id={controlName}
              label={label}
              required={required}
              optional={!required}
              value={values[controlName] != null ? String(values[controlName]) : undefined}
              onChange={(value) => setValue(controlName, value ?? '')}
              error={error}
            />
          );
        }

        if (column.columnDisplayType === 'TEXT') {
          return (
            <TextField
              key={column.columnName}
              id={controlName}
              className="sm:col-span-2"
              label={label}
              required={required}
              optional={!required}
              multiline
              value={String(values[controlName] ?? '')}
              onChange={(value) => setValue(controlName, value)}
              error={error}
            />
          );
        }

        if (isNumericColumn(column.columnDisplayType)) {
          const integerOnly = column.columnDisplayType === 'INTEGER';
          return (
            <NumericField
              key={column.columnName}
              id={controlName}
              label={label}
              required={required}
              optional={!required}
              integer={integerOnly}
              value={String(values[controlName] ?? '')}
              onChange={(value) =>
                setValue(
                  controlName,
                  value === ''
                    ? ''
                    : integerOnly
                      ? Number.parseInt(value, 10)
                      : Number(value)
                )
              }
              error={error}
            />
          );
        }

        return (
          <TextField
            key={column.columnName}
            id={controlName}
            label={label}
            required={required}
            optional={!required}
            value={String(values[controlName] ?? '')}
            onChange={(value) => setValue(controlName, value)}
            error={error}
          />
        );
      })}
    </div>
  );
}
