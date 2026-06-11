'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportAllowedParameter } from '@mifos/api-client';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export type ReportParameterRow = {
  id?: string | number;
  parameterId: number;
  parameterName: string;
  reportParameterName?: string;
};

export function ReportParametersEditor({
  parameters,
  allowedParameters,
  disabled = false,
  onChange,
  error
}: {
  parameters: ReportParameterRow[];
  allowedParameters: FineractReportAllowedParameter[];
  disabled?: boolean;
  onChange: (parameters: ReportParameterRow[]) => void;
  error?: string;
}) {
  const usedParameterIds = useMemo(
    () => new Set(parameters.map((parameter) => parameter.parameterId).filter((id) => id > 0)),
    [parameters]
  );

  function optionsForRow(index: number) {
    const currentId = parameters[index]?.parameterId;
    return allowedParameters.filter(
      (parameter) => parameter.id === currentId || !usedParameterIds.has(parameter.id)
    );
  }

  function updateRow(index: number, patch: Partial<ReportParameterRow>) {
    const next = [...parameters];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(parameters.filter((_, rowIndex) => rowIndex !== index));
  }

  function addRow() {
    onChange([
      ...parameters,
      {
        id: '',
        parameterId: 0,
        parameterName: '',
        reportParameterName: ''
      }
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Parameters</h3>
          <p className="text-sm text-muted-foreground">
            Values users enter when running this report. Use placeholders like{' '}
            <code className="text-xs">${'{parameterName}'}</code> in SQL.
          </p>
        </div>
        {!disabled ? (
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        ) : null}
      </div>

      {parameters.length ? (
        <div className="space-y-3">
          {parameters.map((parameter, index) => (
            <div
              key={`${parameter.parameterId}-${index}`}
              className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="space-y-2">
                <Label className="text-xs">Parameter</Label>
                <Select
                  value={parameter.parameterId > 0 ? String(parameter.parameterId) : ''}
                  onValueChange={(value) => {
                    if (!value) {
                      return;
                    }
                    const id = Number(value);
                    const match = allowedParameters.find((item) => item.id === id);
                    updateRow(index, {
                      parameterId: id,
                      parameterName: match?.parameterName ?? String(id),
                      reportParameterName:
                        parameter.reportParameterName?.trim() ||
                        match?.parameterName ||
                        ''
                    });
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsForRow(index).map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.parameterName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Name passed to report engine</Label>
                <Input
                  value={parameter.reportParameterName ?? ''}
                  onChange={(event) =>
                    updateRow(index, { reportParameterName: event.target.value })
                  }
                  placeholder="Optional override"
                  disabled={disabled}
                />
              </div>
              {!disabled ? (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(index)}
                    aria-label="Remove parameter"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No parameters configured.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
