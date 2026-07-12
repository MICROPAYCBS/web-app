'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@/components/composites/text-field';
import { cn } from '@/lib/utils';

export function ReportSqlField({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  error,
  className
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}) {
  const trimmed = value.trim();

  if (readOnly) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-sm font-medium">Report SQL</p>
        {trimmed ? (
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap">
            {trimmed}
          </pre>
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            No SQL is defined for this report.
          </p>
        )}
        <p className="text-xs text-muted-foreground">Read-only for core reports.</p>
      </div>
    );
  }

  return (
    <TextField
      label="Report SQL"
      required
      multiline
      rows={14}
      value={value}
      onChange={(next) => onChange?.(next)}
      disabled={disabled}
      error={error}
      placeholder="SELECT … FROM … WHERE …"
      className={cn('font-mono text-xs', className)}
    />
  );
}
