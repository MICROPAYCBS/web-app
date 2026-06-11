'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentOption } from '@mifos/api-client';
import type { TaxGroupMemberInput } from '@mifos/validation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateField } from '@/components/composites/date-field';
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
  formatTaxDate,
  taxComponentName,
  taxComponentSelectOptions,
  taxDateToFormString
} from '@/lib/fineract/tax-display';

function emptyMember(): TaxGroupMemberInput {
  return { taxComponentId: 0, startDate: '', isNew: true };
}

export function TaxGroupMembersEditor({
  members,
  onChange,
  componentOptions,
  mode,
  disabled = false
}: {
  members: TaxGroupMemberInput[];
  onChange: (members: TaxGroupMemberInput[]) => void;
  componentOptions: TaxComponentOption[];
  mode: 'create' | 'edit';
  disabled?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<TaxGroupMemberInput>(emptyMember());
  const [dialogError, setDialogError] = useState<string | null>(null);

  const selectOptions = useMemo(
    () => taxComponentSelectOptions(componentOptions),
    [componentOptions]
  );

  function openCreate() {
    setEditingIndex(null);
    setDraft(emptyMember());
    setDialogError(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setEditingIndex(index);
    setDraft({ ...members[index] });
    setDialogError(null);
    setDialogOpen(true);
  }

  function removeMember(index: number) {
    onChange(members.filter((_, itemIndex) => itemIndex !== index));
  }

  function saveMember() {
    if (!draft.taxComponentId) {
      setDialogError('Select a tax component.');
      return;
    }
    if (!draft.isNew && mode === 'edit' && draft.endDate) {
      // end-date only update for existing members
    } else if (!draft.startDate?.trim()) {
      setDialogError('Start date is required.');
      return;
    }

    const next = [...members];
    if (editingIndex === null) {
      next.push({ ...draft, isNew: mode === 'create' ? true : draft.isNew ?? true });
    } else {
      next[editingIndex] = { ...draft };
    }
    onChange(next);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Tax components</h3>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add component
        </Button>
      </div>

      {members.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Component</th>
                <th className="px-3 py-2 text-left font-medium">Start date</th>
                <th className="px-3 py-2 text-left font-medium">End date</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={`${member.id ?? 'new'}-${member.taxComponentId}-${index}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    {taxComponentName(componentOptions, member.taxComponentId)}
                  </td>
                  <td className="px-3 py-2">{member.startDate ? formatTaxDate(member.startDate) : '—'}</td>
                  <td className="px-3 py-2">{member.endDate ? formatTaxDate(member.endDate) : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => openEdit(index)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        disabled={disabled}
                        onClick={() => removeMember(index)}
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
        <p className="text-sm text-muted-foreground">Add at least one tax component to this group.</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex === null ? 'Add tax component' : 'Edit tax component'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <SelectField
              label="Tax component"
              required
              value={draft.taxComponentId ? String(draft.taxComponentId) : undefined}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  taxComponentId: value ? Number(value) : 0
                }))
              }
              options={selectOptions}
              placeholder="Select component"
              disabled={disabled || (!draft.isNew && mode === 'edit')}
            />
            {!draft.endDate || draft.isNew || mode === 'create' ? (
              <DateField
                label="Start date"
                required
                value={draft.startDate}
                onChange={(value) => setDraft((current) => ({ ...current, startDate: value }))}
                allowFuture
                disabled={disabled}
              />
            ) : null}
            {mode === 'edit' && !draft.isNew ? (
              <DateField
                label="End date"
                optional
                value={draft.endDate}
                onChange={(value) => setDraft((current) => ({ ...current, endDate: value }))}
                allowFuture
                disabled={disabled}
              />
            ) : null}
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
            <Button type="button" onClick={saveMember} disabled={disabled}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function taxGroupMembersFromDetail(
  associations: Array<{
    id: number;
    taxComponent: { id: number };
    startDate?: number[] | string;
    endDate?: number[] | string;
  }>
): TaxGroupMemberInput[] {
  return associations.map((association) => ({
    id: association.id,
    taxComponentId: association.taxComponent.id,
    startDate: taxDateToFormString(association.startDate),
    endDate: taxDateToFormString(association.endDate),
    isNew: false
  }));
}
