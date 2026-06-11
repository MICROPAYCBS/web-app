'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { updateOrganizationCurrenciesAction } from '@/actions/organization-currency';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  filterOrganizationCurrencyOptions,
  organizationCurrencyLabel
} from '@/lib/fineract/organization-currency-display';
import { ORGANIZATION_CURRENCIES_PATH } from '@/lib/fineract/organization-currency-paths';
import { cn } from '@/lib/utils';

export function ManageCurrenciesPageContent({
  initialSelectedCurrencies,
  currencyOptions
}: {
  initialSelectedCurrencies: FineractCurrencyOption[];
  currencyOptions: FineractCurrencyOption[];
}) {
  const [selectedCurrencies, setSelectedCurrencies] = useState(initialSelectedCurrencies);
  const [pending, startTransition] = useTransition();
  const [pickerValue, setPickerValue] = useState<string | undefined>();
  const [pickerFilter, setPickerFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FineractCurrencyOption | null>(null);

  const selectedCodes = useMemo(
    () => new Set(selectedCurrencies.map((currency) => currency.code).filter(Boolean)),
    [selectedCurrencies]
  );

  const availableOptions = useMemo(
    () =>
      currencyOptions.filter(
        (currency): currency is FineractCurrencyOption & { code: string } =>
          Boolean(currency.code) && !selectedCodes.has(currency.code)
      ),
    [currencyOptions, selectedCodes]
  );

  const filteredPickerOptions = useMemo(() => {
    return filterOrganizationCurrencyOptions(availableOptions, pickerFilter).map((currency) => ({
      value: currency.code!,
      label: organizationCurrencyLabel(currency),
      keywords: [currency.name, currency.code].filter(Boolean) as string[]
    }));
  }, [availableOptions, pickerFilter]);

  function persistCurrencyCodes(nextCodes: string[], onSuccess: () => void) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateOrganizationCurrenciesAction({ currencies: nextCodes });
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      onSuccess();
    });
  }

  function handleAddCurrency(event: React.FormEvent) {
    event.preventDefault();
    if (!pickerValue) {
      return;
    }
    const currency = availableOptions.find((option) => option.code === pickerValue);
    if (!currency?.code || selectedCodes.has(currency.code)) {
      return;
    }

    const nextCodes = [...selectedCurrencies.map((item) => item.code!).filter(Boolean), currency.code];
    persistCurrencyCodes(nextCodes, () => {
      setSelectedCurrencies((current) => [...current, currency]);
      setPickerValue(undefined);
      setPickerFilter('');
    });
  }

  function handleDeleteCurrency() {
    if (!deleteTarget?.code) {
      return;
    }
    const nextCodes = selectedCurrencies
      .map((currency) => currency.code)
      .filter((code): code is string => Boolean(code) && code !== deleteTarget.code);

    persistCurrencyCodes(nextCodes, () => {
      setSelectedCurrencies((current) =>
        current.filter((currency) => currency.code !== deleteTarget.code)
      );
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <ListPage
        title="Manage currencies"
        description="Choose which currencies are available across your organization."
        backLink={
          <DetailBackLink href={ORGANIZATION_CURRENCIES_PATH} label="Back to currencies" />
        }
      >
        <div className="mx-auto max-w-3xl space-y-8">
          {actionError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <form className="space-y-4 rounded-lg border border-border p-4" onSubmit={handleAddCurrency}>
            <h3 className="text-sm font-medium">Add currency</h3>
            <Input
              placeholder="Search currencies…"
              value={pickerFilter}
              onChange={(event) => setPickerFilter(event.target.value)}
              aria-label="Search currencies"
            />
            <SelectField
              id="currency-picker"
              label="Currency"
              required
              value={pickerValue}
              onValueChange={setPickerValue}
              options={filteredPickerOptions}
              placeholder="Select currency"
              disabled={pending || filteredPickerOptions.length === 0}
            />
            <Button type="submit" disabled={!pickerValue || pending}>
              <Plus className="mr-2 size-4" />
              Add currency
            </Button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Selected currencies</h3>
            {selectedCurrencies.length ? (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {selectedCurrencies.map((currency) => (
                  <li
                    key={currency.code}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{currency.name ?? currency.code}</p>
                      <p className="text-muted-foreground">{currency.code}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setDeleteTarget(currency)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No currencies selected yet.
              </p>
            )}
          </div>

          <Link href={ORGANIZATION_CURRENCIES_PATH} className={cn(buttonVariants({ variant: 'outline' }))}>
            Done
          </Link>
        </div>
      </ListPage>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove currency</DialogTitle>
            <DialogDescription>
              Remove {deleteTarget ? organizationCurrencyLabel(deleteTarget) : 'this currency'} from
              your organization?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDeleteCurrency}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
