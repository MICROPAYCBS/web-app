'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate } from '@mifos/api-client';
import { useMemo, useState } from 'react';
import {
  filterSystemColumns,
  getDatatableControlName,
  isDateColumn,
  isNumericColumn,
  toDatatableDisplayLabel
} from '@/lib/fineract/datatables';
import { fineractDateToIso, isoDateToFineract } from '@/lib/fineract/date-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function DatatableStep({
  datatable,
  values,
  onChange,
  onBack,
  onNext
}: {
  datatable: FineractClientDatatableTemplate;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const columns = useMemo(
    () => filterSystemColumns(datatable.columnHeaderData ?? []),
    [datatable.columnHeaderData]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setValue(controlName: string, value: unknown) {
    onChange({ ...values, [controlName]: value });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const column of columns) {
      if (column.isColumnNullable) {
        continue;
      }
      const controlName = getDatatableControlName(column);
      const raw = values[controlName];
      if (raw === '' || raw === undefined || raw === null) {
        next[controlName] = `${toDatatableDisplayLabel(column.columnName)} is required`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Custom fields for table <strong>{datatable.registeredTableName}</strong>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {columns.map((column) => {
          const controlName = getDatatableControlName(column);
          const label = toDatatableDisplayLabel(column.columnName);
          const required = !column.isColumnNullable;

          if (column.columnDisplayType === 'BOOLEAN') {
            return (
              <div key={column.columnName} className="flex items-center gap-2">
                <Checkbox
                  id={controlName}
                  checked={values[controlName] === true}
                  onCheckedChange={(c) => setValue(controlName, c === true)}
                />
                <Label htmlFor={controlName}>{label}</Label>
              </div>
            );
          }

          if (column.columnDisplayType === 'CODELOOKUP') {
            return (
              <div key={column.columnName} className="space-y-2">
                <Label>
                  {label}
                  {required ? ' *' : ''}
                </Label>
                <Select
                  value={values[controlName] != null ? String(values[controlName]) : ''}
                  onValueChange={(v) => setValue(controlName, Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {column.columnValues?.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[controlName] ? (
                  <p className="text-xs text-destructive">{errors[controlName]}</p>
                ) : null}
              </div>
            );
          }

          if (isDateColumn(column.columnDisplayType)) {
            return (
              <div key={column.columnName} className="space-y-2">
                <Label>
                  {label}
                  {required ? ' *' : ''}
                </Label>
                <Input
                  type="date"
                  value={fineractDateToIso(String(values[controlName] ?? ''))}
                  onChange={(e) =>
                    setValue(controlName, e.target.value ? isoDateToFineract(e.target.value) : '')
                  }
                />
                {errors[controlName] ? (
                  <p className="text-xs text-destructive">{errors[controlName]}</p>
                ) : null}
              </div>
            );
          }

          if (column.columnDisplayType === 'TEXT') {
            return (
              <div key={column.columnName} className="space-y-2 sm:col-span-2">
                <Label>
                  {label}
                  {required ? ' *' : ''}
                </Label>
                <Textarea
                  rows={2}
                  value={String(values[controlName] ?? '')}
                  onChange={(e) => setValue(controlName, e.target.value)}
                />
                {errors[controlName] ? (
                  <p className="text-xs text-destructive">{errors[controlName]}</p>
                ) : null}
              </div>
            );
          }

          return (
            <div key={column.columnName} className="space-y-2">
              <Label>
                {label}
                {required ? ' *' : ''}
              </Label>
              <Input
                type={isNumericColumn(column.columnDisplayType) ? 'number' : 'text'}
                value={String(values[controlName] ?? '')}
                onChange={(e) =>
                  setValue(
                    controlName,
                    isNumericColumn(column.columnDisplayType)
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
              />
              {errors[controlName] ? (
                <p className="text-xs text-destructive">{errors[controlName]}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (validate()) {
              onNext();
            }
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
