'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  OrganizationCashierListItem,
  OrganizationCashierSummary,
  OrganizationCashierTransaction,
  OrganizationTeller
} from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { loadCashierSummaryAction } from '@/actions/cashier';
import { CashierCashActionSheet } from '@/components/organization/cashier-cash-action-sheet';
import { CashierFormSheet } from '@/components/organization/cashier-form-sheet';
import { CashierSummaryFields } from '@/components/organization/cashier-summary-fields';
import { CashierTransactionsTable } from '@/components/organization/cashier-transactions-table';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { tellerCashiersPath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/components/composites/select-field';

function sortTransactions(
  transactions: OrganizationCashierTransaction[]
): OrganizationCashierTransaction[] {
  return [...transactions].sort((left, right) => {
    const leftTime = Date.parse(formatFineractDateArray(left.txnDate) ?? '') || 0;
    const rightTime = Date.parse(formatFineractDateArray(right.txnDate) ?? '') || 0;
    return rightTime - leftTime;
  });
}

export function CashierDetailView({
  teller,
  cashier,
  currencies,
  initialCurrencyCode,
  initialSummary,
  canUpdate,
  canAllocate,
  canSettle,
  showCashiersListBackLink = true,
  preventCashierOverdraw = false
}: {
  teller: OrganizationTeller;
  cashier: OrganizationCashierListItem;
  currencies: FineractCurrencyOption[];
  initialCurrencyCode: string;
  initialSummary: OrganizationCashierSummary;
  canUpdate: boolean;
  canAllocate: boolean;
  canSettle: boolean;
  showCashiersListBackLink?: boolean;
  preventCashierOverdraw?: boolean;
}) {
  const [currencyCode, setCurrencyCode] = useState(initialCurrencyCode);
  const [summary, setSummary] = useState(initialSummary);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSummary(initialSummary);
    setCurrencyCode(initialCurrencyCode);
  }, [initialCurrencyCode, initialSummary]);

  const currencyOptions = useMemo<SelectOption[]>(
    () =>
      currencies
        .filter((currency) => currency.code)
        .map((currency) => ({
          value: currency.code!,
          label: currency.name ? `${currency.code} — ${currency.name}` : currency.code!,
          keywords: [currency.code!, currency.name].filter(Boolean) as string[]
        })),
    [currencies]
  );

  const transactions = useMemo(
    () => sortTransactions(summary.cashierTransactions?.pageItems ?? []),
    [summary.cashierTransactions?.pageItems]
  );

  function reloadSummary(nextCurrencyCode: string) {
    setSummaryError(null);
    startTransition(async () => {
      const result = await loadCashierSummaryAction(teller.id, cashier.id, nextCurrencyCode);
      if (!result.ok) {
        setSummaryError(formatActionErrorMessage(result.message));
        return;
      }
      setSummary(result.summary);
      setCurrencyCode(nextCurrencyCode);
    });
  }

  const displayName =
    summary.cashierName ?? cashier.staffName ?? `Cashier ${cashier.id}`;

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              showCashiersListBackLink ? (
                <DetailBackLink
                  href={tellerCashiersPath(teller.id)}
                  label="Back to cashiers"
                />
              ) : (
                <DetailBackLink href="/" label="Back to dashboard" />
              )
            }
            title={displayName}
            meta={[summary.tellerName ?? teller.name, summary.officeName ?? teller.officeName]
              .filter(Boolean)
              .join(' · ')}
            actionsClassName="sm:self-end"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SelectField
                  id="cashier-currency"
                  label="Currency"
                  hideLabel
                  value={currencyCode}
                  onValueChange={(value) => {
                    if (value && value !== currencyCode) {
                      reloadSummary(value);
                    }
                  }}
                  options={currencyOptions}
                  disabled={pending || currencyOptions.length === 0}
                  className="w-44"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  aria-busy={pending}
                  onClick={() => reloadSummary(currencyCode)}
                >
                  <RefreshCw
                    className={cn('mr-2 size-4', pending && 'animate-spin')}
                    aria-hidden
                  />
                  {pending ? 'Refreshing…' : 'Refresh'}
                </Button>
                {canUpdate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit assignment
                  </Button>
                ) : null}
                {canAllocate ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => setAllocateOpen(true)}
                  >
                    <ArrowDownToLine className="mr-2 size-4" />
                    Allocate
                  </Button>
                ) : null}
                {canSettle ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => setSettleOpen(true)}
                  >
                    <ArrowUpFromLine className="mr-2 size-4" />
                    Settle
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        {summaryError ? (
          <p className="mb-4 text-sm text-destructive">{summaryError}</p>
        ) : null}

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions{transactions.length > 0 ? ` (${transactions.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <CashierSummaryFields
              summary={summary}
              currencyCode={currencyCode}
              cashier={cashier}
              tellerName={summary.tellerName ?? teller.name}
            />
          </TabsContent>

          <TabsContent value="transactions" className="mt-0 space-y-4">
            <CashierTransactionsTable
              transactions={transactions}
              currencyCode={currencyCode}
              loading={pending}
            />
          </TabsContent>
        </Tabs>
      </DetailPage>

      {canUpdate ? (
        <CashierFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          tellerId={teller.id}
          staff={[]}
          cashier={cashier}
        />
      ) : null}

      {canAllocate ? (
        <CashierCashActionSheet
          open={allocateOpen}
          onOpenChange={setAllocateOpen}
          mode="allocate"
          tellerId={teller.id}
          cashierId={cashier.id}
          currencyCode={currencyCode}
        />
      ) : null}

      {canSettle ? (
        <CashierCashActionSheet
          open={settleOpen}
          onOpenChange={setSettleOpen}
          mode="settle"
          tellerId={teller.id}
          cashierId={cashier.id}
          currencyCode={currencyCode}
          preventCashierOverdraw={preventCashierOverdraw}
          availableNetCash={summary.netCash}
        />
      ) : null}
    </>
  );
}
