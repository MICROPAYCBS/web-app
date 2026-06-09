'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportAllowedParameter } from '@mifos/api-client';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ReportParameterDialog,
  type ReportParameterDialogValue
} from '@/components/system/report-parameter-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export type ReportParameterRow = {
  id?: string | number;
  parameterId: number;
  parameterName: string;
  reportParameterName?: string;
};

export function ReportParametersTable({
  parameters,
  allowedParameters,
  disabled = false,
  onChange
}: {
  parameters: ReportParameterRow[];
  allowedParameters: FineractReportAllowedParameter[];
  disabled?: boolean;
  onChange: (parameters: ReportParameterRow[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const availableParameters = useMemo(() => {
    const usedIds = new Set(parameters.map((parameter) => parameter.parameterId));
    return allowedParameters.filter((parameter) => !usedIds.has(parameter.id));
  }, [allowedParameters, parameters]);

  function openCreateDialog() {
    setDialogMode('create');
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function openEditDialog(index: number) {
    setDialogMode('edit');
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function handleSave(value: ReportParameterDialogValue) {
    const parameterName =
      allowedParameters.find((parameter) => parameter.id === value.parameterId)?.parameterName ??
      String(value.parameterId);
    const nextRow: ReportParameterRow = {
      id: editingIndex != null ? parameters[editingIndex]?.id : '',
      parameterId: value.parameterId,
      parameterName,
      reportParameterName: value.reportParameterName
    };
    if (editingIndex != null) {
      const next = [...parameters];
      next[editingIndex] = nextRow;
      onChange(next);
      return;
    }
    onChange([...parameters, nextRow]);
  }

  function confirmDelete() {
    if (deleteIndex == null) {
      return;
    }
    onChange(parameters.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Report parameters</h3>
          <p className="text-sm text-muted-foreground">
            Parameters available when running this report.
          </p>
        </div>
        {!disabled ? (
          <Button type="button" variant="outline" size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            Add parameter
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Parameter</span>
          <span>Name passed to report engine</span>
          <span className="text-right">Actions</span>
        </div>
        {parameters.length ? (
          parameters.map((parameter, index) => (
            <div
              key={`${parameter.parameterId}-${index}`}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="text-sm">{parameter.parameterName}</span>
              <span className="text-sm text-muted-foreground">
                {parameter.reportParameterName || '—'}
              </span>
              {!disabled ? (
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(index)}
                    aria-label="Edit parameter"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteIndex(index)}
                    aria-label="Delete parameter"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : (
                <span />
              )}
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">No parameters configured.</p>
        )}
      </div>

      <ReportParameterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        allowedParameters={
          dialogMode === 'edit' && editingIndex != null
            ? allowedParameters
            : availableParameters
        }
        initialValue={
          editingIndex != null
            ? {
                parameterId: parameters[editingIndex].parameterId,
                reportParameterName: parameters[editingIndex].reportParameterName
              }
            : undefined
        }
        onSave={handleSave}
      />

      <Dialog open={deleteIndex != null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete report parameter</DialogTitle>
            <DialogDescription>
              Remove this parameter from the report configuration?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteIndex(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
