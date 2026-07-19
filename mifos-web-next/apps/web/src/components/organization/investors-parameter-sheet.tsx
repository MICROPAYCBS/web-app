'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Search } from 'lucide-react';
import { useId } from 'react';
import { DateField } from '@/components/composites/date-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { fineractDateToDate, fineractDateToIso, todayStart } from '@/lib/fineract/date-input';

export type InvestorSearchForm = {
  text: string;
  effectiveFromDate: string;
  effectiveToDate: string;
  settlementFromDate: string;
  settlementToDate: string;
};

export const EMPTY_INVESTOR_SEARCH: InvestorSearchForm = {
  text: '',
  effectiveFromDate: '',
  effectiveToDate: '',
  settlementFromDate: '',
  settlementToDate: ''
};

export function toInvestorSearchRequest(form: InvestorSearchForm) {
  return {
    text: form.text || undefined,
    effectiveFromDate: fineractDateToIso(form.effectiveFromDate) || undefined,
    effectiveToDate: fineractDateToIso(form.effectiveToDate) || undefined,
    settlementFromDate: fineractDateToIso(form.settlementFromDate) || undefined,
    settlementToDate: fineractDateToIso(form.settlementToDate) || undefined
  };
}

export function InvestorsParameterSheet({
  open,
  onOpenChange,
  form,
  fieldErrors,
  pending = false,
  onFormChange,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InvestorSearchForm;
  fieldErrors?: Record<string, string>;
  pending?: boolean;
  onFormChange: <K extends keyof InvestorSearchForm>(
    key: K,
    value: InvestorSearchForm[K]
  ) => void;
  onSubmit: () => void;
}) {
  const formId = useId();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>Search parameters</SheetTitle>
          <SheetDescription>
            Filter external asset owner transfers by text and effective or settlement dates.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <form
            id={formId}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="investor-search-text">Search text</Label>
              <Input
                id="investor-search-text"
                value={form.text}
                onChange={(event) => onFormChange('text', event.target.value)}
                placeholder="Owner or transfer external ID"
              />
              {fieldErrors?.text ? (
                <p className="text-sm text-destructive">{fieldErrors.text}</p>
              ) : null}
            </div>
            <DateField
              id="investor-effective-from"
              label="Effective date from"
              value={form.effectiveFromDate}
              onChange={(value) => onFormChange('effectiveFromDate', value ?? '')}
              toDate={
                form.effectiveToDate ? fineractDateToDate(form.effectiveToDate) : todayStart()
              }
              error={fieldErrors?.effectiveFromDate}
            />
            <DateField
              id="investor-effective-to"
              label="Effective date to"
              value={form.effectiveToDate}
              onChange={(value) => onFormChange('effectiveToDate', value ?? '')}
              toDate={todayStart()}
              error={fieldErrors?.effectiveToDate}
            />
            <DateField
              id="investor-settlement-from"
              label="Settlement date from"
              value={form.settlementFromDate}
              onChange={(value) => onFormChange('settlementFromDate', value ?? '')}
              toDate={
                form.settlementToDate ? fineractDateToDate(form.settlementToDate) : todayStart()
              }
              error={fieldErrors?.settlementFromDate}
            />
            <DateField
              id="investor-settlement-to"
              label="Settlement date to"
              value={form.settlementToDate}
              onChange={(value) => onFormChange('settlementToDate', value ?? '')}
              toDate={todayStart()}
              error={fieldErrors?.settlementToDate}
            />
          </form>
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Close
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            <Search className="mr-2 size-4" />
            {pending ? 'Searching…' : 'Search'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
