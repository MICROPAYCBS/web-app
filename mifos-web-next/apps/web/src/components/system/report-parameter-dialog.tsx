'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportAllowedParameter } from '@mifos/api-client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export type ReportParameterDialogValue = {
  parameterId: number;
  reportParameterName?: string;
};

export function ReportParameterDialog({
  open,
  onOpenChange,
  mode,
  allowedParameters,
  initialValue,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  allowedParameters: FineractReportAllowedParameter[];
  initialValue?: ReportParameterDialogValue;
  onSave: (value: ReportParameterDialogValue) => void;
}) {
  const [parameterId, setParameterId] = useState<string>(
    initialValue ? String(initialValue.parameterId) : ''
  );
  const [reportParameterName, setReportParameterName] = useState(
    initialValue?.reportParameterName ?? ''
  );

  useEffect(() => {
    if (open) {
      setParameterId(initialValue ? String(initialValue.parameterId) : '');
      setReportParameterName(initialValue?.reportParameterName ?? '');
    }
  }, [initialValue, open]);

  function handleSave() {
    const id = Number(parameterId);
    if (!Number.isFinite(id)) {
      return;
    }
    onSave({
      parameterId: id,
      reportParameterName: reportParameterName.trim() || undefined
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add report parameter' : 'Edit report parameter'}</DialogTitle>
          <DialogDescription>
            Choose a parameter and optionally override the name passed to the report engine.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-parameter-id">Parameter</Label>
            <Select value={parameterId} onValueChange={(value) => value && setParameterId(value)}>
              <SelectTrigger id="report-parameter-id">
                <SelectValue placeholder="Select a parameter" />
              </SelectTrigger>
              <SelectContent>
                {allowedParameters.map((parameter) => (
                  <SelectItem key={parameter.id} value={String(parameter.id)}>
                    {parameter.parameterName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-parameter-name">Name passed to report engine</Label>
            <Input
              id="report-parameter-name"
              value={reportParameterName}
              onChange={(event) => setReportParameterName(event.target.value)}
              placeholder="Optional override"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!parameterId}>
            {mode === 'create' ? 'Add parameter' : 'Save parameter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
