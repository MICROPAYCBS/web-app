'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  StandingInstructionRunHistoryItem,
  StandingInstructionTemplate
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { searchStandingInstructionHistoryAction } from '@/actions/standing-instruction-history';
import { StandingInstructionHistoryTable } from '@/components/organization/standing-instruction-history-table';
import { DateField } from '@/components/composites/date-field';
import { ListPage } from '@/components/composites/list-page';
import { sanitizeNumericInput } from '@/components/composites/numeric-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { fineractDateToDate, todayStart } from '@/lib/fineract/date-input';
import { standingInstructionEnumLabel } from '@/lib/fineract/standing-instruction-display';
import { cn } from '@/lib/utils';

type SearchFormState = {
  clientName: string;
  clientId: string;
  transferType: string;
  fromAccountType: string;
  fromAccountId: string;
  fromDate: string;
  toDate: string;
};

const EMPTY_FORM: SearchFormState = {
  clientName: '',
  clientId: '',
  transferType: '',
  fromAccountType: '',
  fromAccountId: '',
  fromDate: '',
  toDate: ''
};

export function StandingInstructionHistoryPageContent({
  template
}: {
  template: StandingInstructionTemplate;
}) {
  const [form, setForm] = useState<SearchFormState>(EMPTY_FORM);
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState<StandingInstructionRunHistoryItem[]>([]);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'fromAccountType' && !value) {
        next.fromAccountId = '';
      }
      return next;
    });
  }

  function runSearch(nextForm: SearchFormState) {
    startTransition(async () => {
      const result = await searchStandingInstructionHistoryAction({
        clientName: nextForm.clientName || undefined,
        clientId: nextForm.clientId || undefined,
        transferType: nextForm.transferType ? Number(nextForm.transferType) : undefined,
        fromAccountType: nextForm.fromAccountType ? Number(nextForm.fromAccountType) : undefined,
        fromAccountId: nextForm.fromAccountId || undefined,
        fromDate: nextForm.fromDate || undefined,
        toDate: nextForm.toDate || undefined,
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems(result.data.pageItems);
      setShowResults(true);
    });
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(form);
  }

  return (
    <ListPage
      title="Standing instructions history"
      description="Search execution history for standing instructions across the organization."
      actions={
        showResults ? (
          <Button type="button" variant="outline" onClick={() => setShowResults(false)}>
            <Filter className="mr-2 size-4" />
            Parameters
          </Button>
        ) : null
      }
    >
      {!showResults ? (
        <Card>
          <form onSubmit={handleSearch}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="si-client-name">Client name</Label>
                <Input
                  id="si-client-name"
                  value={form.clientName}
                  onChange={(event) => updateForm('clientName', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-client-id">Client ID</Label>
                <Input
                  id="si-client-id"
                  inputMode="numeric"
                  value={form.clientId}
                  onChange={(event) => updateForm('clientId', sanitizeNumericInput(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-transfer-type">Transfer type</Label>
                <Select
                  value={form.transferType || undefined}
                  onValueChange={(value) => updateForm('transferType', value ?? '')}
                >
                  <SelectTrigger id="si-transfer-type" className="w-full">
                    <SelectValue placeholder="Any transfer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template.transferTypeOptions ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {standingInstructionEnumLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-account-type">Account type</Label>
                <Select
                  value={form.fromAccountType || undefined}
                  onValueChange={(value) => updateForm('fromAccountType', value ?? '')}
                >
                  <SelectTrigger id="si-account-type" className="w-full">
                    <SelectValue placeholder="Any account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template.fromAccountTypeOptions ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {standingInstructionEnumLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.fromAccountType ? (
                <div className="space-y-2">
                  <Label htmlFor="si-from-account-id">From account ID</Label>
                  <Input
                    id="si-from-account-id"
                    inputMode="numeric"
                    value={form.fromAccountId}
                    onChange={(event) =>
                      updateForm('fromAccountId', sanitizeNumericInput(event.target.value))
                    }
                  />
                </div>
              ) : null}
              <DateField
                id="si-from-date"
                label="From date"
                value={form.fromDate}
                onChange={(value) => updateForm('fromDate', value ?? '')}
                toDate={form.toDate ? fineractDateToDate(form.toDate) : todayStart()}
              />
              <DateField
                id="si-to-date"
                label="To date"
                value={form.toDate}
                onChange={(value) => updateForm('toDate', value ?? '')}
                toDate={todayStart()}
              />
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
              <Link href="/organization" className={cn(buttonVariants({ variant: 'outline' }))}>
                Cancel
              </Link>
              <Can permission="READ_STANDINGINSTRUCTION">
                <Button type="submit" disabled={pending}>
                  <Search className="mr-2 size-4" />
                  {pending ? 'Searching…' : 'Search instructions'}
                </Button>
              </Can>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {items.length
              ? `${items.length} result${items.length === 1 ? '' : 's'}`
              : 'No matching execution history.'}
          </p>
          <StandingInstructionHistoryTable items={items} />
        </div>
      )}
    </ListPage>
  );
}
