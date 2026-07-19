'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRatePeriodInput } from '@mifos/validation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DateField } from '@/components/composites/date-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SwitchField } from '@/components/composites/switch-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  floatingRatePeriodMinDateLabel,
  formatFloatingRateDate,
  formatFloatingRateInterestRate,
  formatFloatingRateYesNo,
  isFloatingRatePeriodLocked
} from '@/lib/fineract/floating-rate-display';

function emptyPeriod(): FloatingRatePeriodInput {
  return {
    fromDate: '',
    interestRate: 0,
    isDifferentialToBaseLendingRate: false
  };
}

export function FloatingRatePeriodsEditor({
  periods,
  onChange,
  disabled = false
}: {
  periods: FloatingRatePeriodInput[];
  onChange: (periods: FloatingRatePeriodInput[]) => void;
  disabled?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<FloatingRatePeriodInput>(emptyPeriod());
  const [dialogError, setDialogError] = useState<string | null>(null);

  function openCreate() {
    setEditingIndex(null);
    setDraft(emptyPeriod());
    setDialogError(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    const period = periods[index];
    if (isFloatingRatePeriodLocked(period.fromDate)) {
      return;
    }
    setEditingIndex(index);
    setDraft({ ...period });
    setDialogError(null);
    setDialogOpen(true);
  }

  function removePeriod(index: number) {
    const period = periods[index];
    if (isFloatingRatePeriodLocked(period.fromDate)) {
      return;
    }
    onChange(periods.filter((_, itemIndex) => itemIndex !== index));
  }

  function savePeriod() {
    if (!draft.fromDate?.trim()) {
      setDialogError('From date is required.');
      return;
    }
    if (draft.interestRate === undefined || Number(draft.interestRate) < 0) {
      setDialogError('Interest rate is required.');
      return;
    }
    if (editingIndex === null && isFloatingRatePeriodLocked(draft.fromDate)) {
      setDialogError(`From date must be on or after ${floatingRatePeriodMinDateLabel()}.`);
      return;
    }

    const next = [...periods];
    if (editingIndex === null) {
      next.push({ ...draft });
    } else {
      next[editingIndex] = { ...draft };
    }
    onChange(next);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Floating rate periods</h3>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add period
        </Button>
      </div>

      {periods.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">From date</th>
                <th className="px-3 py-2 text-right font-medium">Interest rate</th>
                <th className="px-3 py-2 text-left font-medium">Differential</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => {
                const locked = isFloatingRatePeriodLocked(period.fromDate);
                return (
                  <tr
                    key={`${period.fromDate}-${period.interestRate}-${index}`}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2">{formatFloatingRateDate(period.fromDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatFloatingRateInterestRate(period.interestRate)}
                    </td>
                    <td className="px-3 py-2">
                      {formatFloatingRateYesNo(period.isDifferentialToBaseLendingRate ?? false)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={disabled || locked}
                          onClick={() => openEdit(index)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={disabled || locked}
                          onClick={() => removePeriod(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add rate periods with effective dates and interest rates.
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex === null ? 'Add floating rate period' : 'Edit floating rate period'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DateField
              label="From date"
              required
              value={draft.fromDate}
              onChange={(value) => setDraft((current) => ({ ...current, fromDate: value ?? '' }))}
              allowFuture
              disabled={disabled || (editingIndex !== null && isFloatingRatePeriodLocked(draft.fromDate))}
            />
            <NumericField
              label="Interest rate"
              required
              value={String(draft.interestRate ?? '')}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  interestRate: value ? Number(value) : 0
                }))
              }
              disabled={disabled}
            />
            <SwitchField
              label="Differential to base lending rate"
              checked={draft.isDifferentialToBaseLendingRate ?? false}
              onCheckedChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  isDifferentialToBaseLendingRate: checked
                }))
              }
              disabled={disabled}
            />
            {dialogError ? (
              <p className="text-sm text-destructive" role="alert">
                {dialogError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={savePeriod} disabled={disabled}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
