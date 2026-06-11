'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption
} from '@mifos/api-client';
import { useId } from 'react';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import type { JournalEntrySearchFilters } from '@/lib/fineract/journal-entry-query';
import { cn } from '@/lib/utils';

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'All entries' },
  { value: 'true', label: 'Manual entries' }
];

export function JournalEntriesFilterFields({
  draft,
  onDraftChange,
  offices,
  glAccounts,
  pending = false
}: {
  draft: JournalEntrySearchFilters;
  onDraftChange: (draft: JournalEntrySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  pending?: boolean;
}) {
  function patchDraft(patch: Partial<JournalEntrySearchFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <div className="space-y-4">
      <SelectField
        label="Branch"
        optional
        value={draft.officeId}
        onValueChange={(value) => patchDraft({ officeId: value })}
        options={offices.map((office) => ({
          value: String(office.id),
          label: office.name ?? office.nameDecorated ?? String(office.id)
        }))}
        placeholder="All branches"
        disabled={pending}
      />
      <SelectField
        label="GL account"
        optional
        value={draft.glAccountId}
        onValueChange={(value) => patchDraft({ glAccountId: value })}
        options={glAccounts.map((account) => ({
          value: String(account.id),
          label: formatJournalEntryGlAccountLabel(account),
          keywords: [account.glCode, account.name]
        }))}
        placeholder="All accounts"
        disabled={pending}
      />
      <SelectField
        label="Entry type"
        optional
        value={draft.manualEntriesOnly ?? ''}
        onValueChange={(value) => patchDraft({ manualEntriesOnly: value ?? '' })}
        options={ENTRY_TYPE_OPTIONS}
        disabled={pending}
      />
      <DateField
        label="Transaction date from"
        value={draft.fromDate}
        onChange={(value) => patchDraft({ fromDate: value })}
        disabled={pending}
      />
      <DateField
        label="Transaction date to"
        value={draft.toDate}
        onChange={(value) => patchDraft({ toDate: value })}
        disabled={pending}
      />
      <TextField
        label="Transaction ID"
        optional
        value={draft.transactionId ?? ''}
        onChange={(value) => patchDraft({ transactionId: value })}
        disabled={pending}
      />
      <DateField
        label="Submitted on from"
        optional
        value={draft.submittedOnDateFrom}
        onChange={(value) => patchDraft({ submittedOnDateFrom: value })}
        disabled={pending}
      />
      <DateField
        label="Submitted on to"
        optional
        value={draft.submittedOnDateTo}
        onChange={(value) => patchDraft({ submittedOnDateTo: value })}
        disabled={pending}
      />
    </div>
  );
}

export function JournalEntriesFilterSidebar({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  offices,
  glAccounts,
  pending = false,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: JournalEntrySearchFilters;
  onDraftChange: (draft: JournalEntrySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  pending?: boolean;
  onApply: (filters: JournalEntrySearchFilters) => void;
  onClear: () => void;
}) {
  const formId = useId();

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  function handleClear() {
    onClear();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          'flex flex-col gap-0 p-0',
          'data-[side=right]:inset-y-auto data-[side=right]:top-4 data-[side=right]:right-4',
          'data-[side=right]:h-[calc(100dvh-2rem)] data-[side=right]:w-full data-[side=right]:sm:max-w-md',
          'rounded-xl border shadow-xl'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>Filter journal entries</SheetTitle>
          <SheetDescription>
            Narrow results by branch, account, dates, or transaction ID.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <form
            id={formId}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleApply();
            }}
          >
            <JournalEntriesFilterFields
              draft={draft}
              onDraftChange={onDraftChange}
              offices={offices}
              glAccounts={glAccounts}
              pending={pending}
            />
          </form>
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button type="button" variant="outline" onClick={handleClear} disabled={pending}>
            Clear filters
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? 'Searching…' : 'Search'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
