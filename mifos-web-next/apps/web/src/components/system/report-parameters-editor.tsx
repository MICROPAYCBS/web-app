'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportAllowedParameter } from '@mifos/api-client';
import { reportEngineParameterName } from '@mifos/domain';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            Values users enter when running this report. The name passed to the report engine is
            shown from the parameter catalog when known. Reference it in SQL as{' '}
            <code className="text-xs">${'{officeId}'}</code>.
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
          {parameters.map((parameter, index) => {
            const engineName =
              parameter.parameterId > 0
                ? reportEngineParameterName(
                    parameter.parameterName,
                    parameter.reportParameterName
                  )
                : undefined;

            return (
            <div
              key={`${parameter.parameterId}-${index}`}
              className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="space-y-2">
                <SelectField
                  id={`report-parameter-${index}`}
                  label="Parameter"
                  required
                  value={parameter.parameterId > 0 ? String(parameter.parameterId) : undefined}
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
                        id === parameter.parameterId ? (parameter.reportParameterName ?? '') : ''
                    });
                  }}
                  options={optionsForRow(index).map((item) => ({
                    value: String(item.id),
                    label: item.parameterName,
                    keywords: [item.parameterName, String(item.id)]
                  }))}
                  placeholder="Search parameters…"
                  emptyMessage="No parameters found."
                  disabled={disabled}
                  className="[&_label]:text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Passed to report engine</Label>
                {engineName ? (
                  <div className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="font-mono text-sm">{engineName}</p>
                    <p className="text-xs text-muted-foreground">
                      SQL placeholder:{' '}
                      <code>{`\${${engineName}}`}</code>
                    </p>
                  </div>
                ) : parameter.parameterId > 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                    Unknown — set a custom override below
                  </p>
                ) : (
                  <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                    Select a parameter
                  </p>
                )}
                {!disabled ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Custom override (optional)
                    </Label>
                    <Input
                      value={parameter.reportParameterName ?? ''}
                      onChange={(event) =>
                        updateRow(index, { reportParameterName: event.target.value })
                      }
                      placeholder="Only when this report uses a different name"
                      disabled={disabled}
                    />
                  </div>
                ) : null}
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
            );
          })}
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
