'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Plus, Trash2 } from 'lucide-react';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';

export function MappingSection<T extends Record<string, number>>({
  title,
  description,
  rows,
  leftLabel,
  rightLabel,
  leftOptions,
  rightOptions,
  leftKey,
  rightKey,
  onChange,
  leftErrorPrefix,
  rightErrorPrefix,
  errors
}: {
  title: string;
  description: string;
  rows: T[];
  leftLabel: string;
  rightLabel: string;
  leftOptions: { value: string; label: string }[];
  rightOptions: { value: string; label: string }[];
  leftKey: keyof T & string;
  rightKey: keyof T & string;
  onChange: (rows: T[]) => void;
  leftErrorPrefix?: string;
  rightErrorPrefix?: string;
  errors?: Record<string, string>;
}) {
  const usedLeftIds = new Set(
    rows.map((row) => row[leftKey]).filter((id) => id > 0).map(String)
  );
  const canAdd =
    leftOptions.length > 0 && leftOptions.some((option) => !usedLeftIds.has(option.value));

  function leftOptionsForRow(index: number) {
    const current = rows[index]?.[leftKey];
    const currentValue = current > 0 ? String(current) : undefined;
    return leftOptions.filter((option) => {
      if (option.value === currentValue) {
        return true;
      }
      return !usedLeftIds.has(option.value);
    });
  }

  function updateRow(index: number, patch: Partial<T>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    if (!canAdd) {
      return;
    }
    onChange([...rows, { [leftKey]: 0, [rightKey]: 0 } as T]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <DetailSection title={title} description={description}>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mappings added.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <SelectField
                label={leftLabel}
                value={row[leftKey] ? String(row[leftKey]) : undefined}
                onValueChange={(value) =>
                  updateRow(index, { [leftKey]: value ? Number(value) : 0 } as Partial<T>)
                }
                options={leftOptionsForRow(index)}
                error={leftErrorPrefix ? errors?.[`${leftErrorPrefix}.${index}.${leftKey}`] : undefined}
              />
              <SelectField
                label={rightLabel}
                value={row[rightKey] ? String(row[rightKey]) : undefined}
                onValueChange={(value) =>
                  updateRow(index, { [rightKey]: value ? Number(value) : 0 } as Partial<T>)
                }
                options={rightOptions}
                error={rightErrorPrefix ? errors?.[`${rightErrorPrefix}.${index}.${rightKey}`] : undefined}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove mapping"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={!canAdd}>
          <Plus className="mr-1 size-4" />
          Add mapping
        </Button>
      </div>
    </DetailSection>
  );
}
