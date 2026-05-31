'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate } from '@mifos/api-client';
import { useMemo } from 'react';
import { DateField } from '@/components/composites/date-field';
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
import type { StepErrors } from '../validation';

export function DatatableStep({
  datatable,
  values,
  errors,
  onChange
}: {
  datatable: FineractClientDatatableTemplate;
  values: Record<string, unknown>;
  errors: StepErrors;
  onChange: (values: Record<string, unknown>) => void;
}) {
  const columns = useMemo(
    () => filterSystemColumns(datatable.columnHeaderData ?? []),
    [datatable.columnHeaderData]
  );

  function setValue(controlName: string, value: unknown) {
    onChange({ ...values, [controlName]: value });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Custom fields for table <strong>{datatable.registeredTableName}</strong>. Required fields
        are marked with an asterisk.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {columns.map((column) => {
          const controlName = getDatatableControlName(column);
          const label = toDatatableDisplayLabel(column.columnName);
          const required = !column.isColumnNullable;
          const error = errors[controlName];

          if (column.columnDisplayType === 'BOOLEAN') {
            return (
              <Field key={column.columnName} className="flex flex-row items-center gap-2">
                <Checkbox
                  id={controlName}
                  checked={values[controlName] === true}
                  onCheckedChange={(c) => setValue(controlName, c === true)}
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
                onValueChange={(v) => setValue(controlName, v ? Number(v) : undefined)}
                options={
                  column.columnValues?.map((opt) => ({
                    value: String(opt.id),
                    label: opt.value
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
                onChange={(v) => setValue(controlName, v ?? '')}
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
                onChange={(v) => setValue(controlName, v)}
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
              type={isNumericColumn(column.columnDisplayType) ? 'number' : 'text'}
              value={String(values[controlName] ?? '')}
              onChange={(v) =>
                setValue(
                  controlName,
                  isNumericColumn(column.columnDisplayType)
                    ? v === ''
                      ? ''
                      : Number(v)
                    : v
                )
              }
              error={error}
            />
          );
        })}
      </div>

    </div>
  );
}
