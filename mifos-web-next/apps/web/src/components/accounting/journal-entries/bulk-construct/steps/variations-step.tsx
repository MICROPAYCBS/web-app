'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { defaultBulkConstructRow } from '@/lib/accounting/bulk-journal-construct';
import type { BulkConstructStepProps } from '../types';

export function BulkConstructVariationsStep({
  form,
  errors,
  pending,
  onPatchRows,
  offices,
  departments
}: BulkConstructStepProps) {
  const { template, rows } = form;
  const byBranch = template.variationMode === 'branch';

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const departmentOptions = useMemo(() => {
    const officeId = template.defaultOfficeId > 0 ? template.defaultOfficeId : undefined;
    return departments
      .filter((department) => department.active !== false)
      .filter(
        (department) =>
          department.officeId == null || officeId == null || department.officeId === officeId
      )
      .map((department) => ({
        value: String(department.id),
        label: department.departmentName,
        keywords: [department.departmentCode]
      }));
  }, [departments, template.defaultOfficeId]);

  function updateRow(index: number, patch: Partial<(typeof rows)[number]>) {
    onPatchRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    if (rows.length >= BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS) {
      return;
    }
    onPatchRows([...rows, defaultBulkConstructRow(template.variationMode)]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      return;
    }
    onPatchRows(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add one row per journal entry. Amount applies to every debit and credit line from the
        template.
      </p>

      {rows.length >= BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Maximum of {BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS} entries per batch. Use Excel import
          for larger volumes.
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`variation-row-${index}`}
            className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
          >
            {byBranch ? (
              <SelectField
                label={`Branch ${index + 1}`}
                required
                value={row.officeId != null ? String(row.officeId) : undefined}
                onValueChange={(value) =>
                  updateRow(index, { officeId: value ? Number(value) : undefined })
                }
                options={officeOptions}
                placeholder="Select branch"
                disabled={pending}
                error={errors[`rows.${index}.officeId`]}
              />
            ) : (
              <SelectField
                label={`Department ${index + 1}`}
                required
                value={row.departmentId != null ? String(row.departmentId) : undefined}
                onValueChange={(value) =>
                  updateRow(index, { departmentId: value ? Number(value) : undefined })
                }
                options={departmentOptions}
                placeholder="Select department"
                disabled={pending}
                error={errors[`rows.${index}.departmentId`]}
              />
            )}
            <MoneyField
              label="Amount"
              required
              currencyCode={template.currencyCode || undefined}
              value={row.amount > 0 ? String(row.amount) : ''}
              onChange={(value) => updateRow(index, { amount: value ? Number(value) : 0 })}
              disabled={pending}
              error={errors[`rows.${index}.amount`]}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={pending || rows.length <= 1}
              onClick={() => removeRow(index)}
              aria-label={`Remove row ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={pending || rows.length >= BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS}
        onClick={addRow}
      >
        <Plus className="mr-2 size-4" />
        Add row
      </Button>
    </div>
  );
}
