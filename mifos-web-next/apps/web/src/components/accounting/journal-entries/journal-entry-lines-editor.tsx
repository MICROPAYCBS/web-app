'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryGlAccountOption } from '@mifos/api-client';
import type { JournalEntryLineInput } from '@mifos/validation';
import { parseAmount } from '@mifos/domain';
import { Minus, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';

export function emptyJournalEntryLine(): JournalEntryLineInput {
  return { glAccountId: 0, amount: 0 };
}

function parseLineAmount(value: string): number {
  const decimal = parseAmount(value);
  return decimal ? decimal.toNumber() : 0;
}

export function JournalEntryLinesEditor({
  label,
  lines,
  fieldPrefix,
  glAccounts,
  currencyCode,
  fieldErrors,
  pending,
  allowMultiple = true,
  onChange
}: {
  label: string;
  lines: JournalEntryLineInput[];
  fieldPrefix: 'debits' | 'credits';
  glAccounts: FineractJournalEntryGlAccountOption[];
  currencyCode: string;
  fieldErrors: Record<string, string>;
  pending: boolean;
  allowMultiple?: boolean;
  onChange: (lines: JournalEntryLineInput[]) => void;
}) {
  const accountOptions = useMemo(
    () =>
      glAccounts.map((account) => ({
        value: String(account.id),
        label: formatJournalEntryGlAccountLabel(account),
        keywords: [account.glCode, account.name]
      })),
    [glAccounts]
  );

  function patchLine(index: number, patch: Partial<JournalEntryLineInput>) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    onChange([...lines, emptyJournalEntryLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      return;
    }
    onChange(lines.filter((_, lineIndex) => lineIndex !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        {allowMultiple ? (
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={pending}>
            <Plus className="mr-2 size-4" />
            Add line
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={`${fieldPrefix}-${index}`}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_minmax(140px,180px)_auto] sm:items-end">
              <SelectField
                label="GL account"
                required
                value={line.glAccountId > 0 ? String(line.glAccountId) : undefined}
                onValueChange={(value) => {
                  if (value) {
                    patchLine(index, { glAccountId: Number(value) });
                  }
                }}
                options={accountOptions}
                placeholder="Select account"
                disabled={pending}
                error={fieldErrors[`${fieldPrefix}.${index}.glAccountId`]}
              />
              <MoneyField
                label="Amount"
                required
                currencyCode={currencyCode}
                value={line.amount > 0 ? String(line.amount) : ''}
                onChange={(value) => patchLine(index, { amount: parseLineAmount(value) })}
                disabled={pending}
                error={fieldErrors[`${fieldPrefix}.${index}.amount`]}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeLine(index)}
                disabled={pending || lines.length <= 1 || !allowMultiple}
                aria-label={`Remove ${label.toLowerCase()} line ${index + 1}`}
              >
                <Minus className="size-4" />
              </Button>
            </div>
            <TextField
              label="Line narration"
              optional
              value={line.comments ?? ''}
              onChange={(value) => patchLine(index, { comments: value || undefined })}
              disabled={pending}
              error={fieldErrors[`${fieldPrefix}.${index}.comments`]}
            />
          </div>
        ))}
      </div>
      {fieldErrors[fieldPrefix] ? (
        <p className="text-sm text-destructive">{fieldErrors[fieldPrefix]}</p>
      ) : null}
    </div>
  );
}
