'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeListItem } from '@mifos/api-client';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  delinquencyRangeSelectOptions,
  formatDelinquencyDays,
  sortDelinquencyRanges
} from '@/lib/fineract/delinquency-display';

export function DelinquencyBucketRangesEditor({
  selectedRangeIds,
  onChange,
  rangeOptions,
  disabled = false
}: {
  selectedRangeIds: number[];
  onChange: (rangeIds: number[]) => void;
  rangeOptions: DelinquencyRangeListItem[];
  disabled?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftRangeId, setDraftRangeId] = useState<string | undefined>();
  const [dialogError, setDialogError] = useState<string | null>(null);

  const sortedOptions = useMemo(() => sortDelinquencyRanges(rangeOptions), [rangeOptions]);
  const selectedRanges = useMemo(
    () =>
      selectedRangeIds
        .map((id) => sortedOptions.find((range) => range.id === id))
        .filter((range): range is DelinquencyRangeListItem => range !== undefined),
    [selectedRangeIds, sortedOptions]
  );

  const availableOptions = useMemo(
    () => delinquencyRangeSelectOptions(sortedOptions.filter((range) => !selectedRangeIds.includes(range.id))),
    [selectedRangeIds, sortedOptions]
  );

  function openDialog() {
    setDraftRangeId(undefined);
    setDialogError(null);
    setDialogOpen(true);
  }

  function addRange() {
    if (!draftRangeId) {
      setDialogError('Select a delinquency range.');
      return;
    }
    onChange([...selectedRangeIds, Number(draftRangeId)]);
    setDialogOpen(false);
  }

  function removeRange(rangeId: number) {
    onChange(selectedRangeIds.filter((id) => id !== rangeId));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Delinquency ranges</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || availableOptions.length === 0}
          onClick={openDialog}
        >
          <Plus className="mr-1 size-4" />
          Add range
        </Button>
      </div>

      {selectedRanges.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Classification</th>
                <th className="px-3 py-2 text-right font-medium">Days from</th>
                <th className="px-3 py-2 text-right font-medium">Days till</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedRanges.map((range) => (
                <tr key={range.id} className="border-t border-border">
                  <td className="px-3 py-2">{range.classification ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatDelinquencyDays(range.minimumAgeDays)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatDelinquencyDays(range.maximumAgeDays)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        disabled={disabled}
                        onClick={() => removeRange(range.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add at least one delinquency range to this bucket.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add delinquency range</DialogTitle>
          </DialogHeader>
          <SelectField
            label="Delinquency range"
            required
            value={draftRangeId}
            onValueChange={setDraftRangeId}
            options={availableOptions}
            placeholder="Select range"
            disabled={disabled}
          />
          {dialogError ? (
            <p className="text-sm text-destructive" role="alert">
              {dialogError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addRange} disabled={disabled}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function delinquencyBucketRangeIdsFromDetail(
  ranges: Array<{ id: number }> | undefined
): number[] {
  return ranges?.map((range) => range.id) ?? [];
}
