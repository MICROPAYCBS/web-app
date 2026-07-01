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
  FineractOfficeOption,
  FineractOpeningBalanceContraAccount,
  FineractOpeningBalanceGlAccount,
  FineractOpeningBalanceTemplate
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatMoney, parseAmount } from '@mifos/domain';
import {
  formatActionErrorMessage,
  validateDefineOpeningBalance,
  type DefineOpeningBalanceInput
} from '@mifos/validation';
import Decimal from 'decimal.js';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toastFineractError } from '@/lib/toast-fineract-error';
import {
  defineOpeningBalanceAction,
  fetchOpeningBalanceTemplateAction,
  type OpeningBalanceFetchResult
} from '@/actions/opening-balances';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { ListPage } from '@/components/composites/list-page';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

const GL_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense'
};

type GlAccountEntryState = {
  debit: string;
  credit: string;
};

function isFetchError(
  value: OpeningBalanceFetchResult
): value is Extract<OpeningBalanceFetchResult, { ok: false }> {
  return 'ok' in value && value.ok === false;
}

function officeLabel(office: FineractOfficeOption): string {
  return office.nameDecorated?.trim() || office.name?.trim() || `Office #${office.id}`;
}

function currencyLabel(currency: FineractCurrencyOption): string {
  const code = currency.code?.trim();
  const name = currency.name?.trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return code ?? name ?? '—';
}

function contraAccountLabel(account?: FineractOpeningBalanceContraAccount): string {
  if (!account) {
    return '—';
  }
  const code = account.glCode?.trim();
  const name = account.nameDecorated?.trim() || account.name?.trim();
  if (code && name) {
    return `(${code}) ${name}`;
  }
  return code ?? name ?? '—';
}

function glAccountTypeLabel(value: string): string {
  return GL_ACCOUNT_TYPE_LABELS[value] ?? value.replace(/_/g, ' ');
}

function emptyEntries(
  accounts: FineractOpeningBalanceGlAccount[]
): Record<number, GlAccountEntryState> {
  const next: Record<number, GlAccountEntryState> = {};
  for (const account of accounts) {
    next[account.glAccountId] = { debit: '', credit: '' };
  }
  return next;
}

function sumEntries(
  entries: Record<number, GlAccountEntryState>,
  side: 'debit' | 'credit'
): Decimal {
  let total = new Decimal(0);
  for (const entry of Object.values(entries)) {
    const amount = parseAmount(entry[side]);
    if (amount) {
      total = total.plus(amount);
    }
  }
  return total;
}

export function MigrateOpeningBalancesForm({
  offices,
  currencies,
  canDefine
}: {
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  canDefine: boolean;
}) {
  const router = useRouter();
  const formId = useId();
  const initialTransactionDate = useInitialTransactionDate();
  const [officeId, setOfficeId] = useState<string | undefined>();
  const [currencyCode, setCurrencyCode] = useState<string | undefined>();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [template, setTemplate] = useState<FineractOpeningBalanceTemplate | null>(null);
  const [entries, setEntries] = useState<Record<number, GlAccountEntryState>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const [retrievePending, startRetrieve] = useTransition();
  const [submitPending, startSubmit] = useTransition();

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: officeLabel(office)
      })),
    [offices]
  );

  const currencyOptions = useMemo(
    () =>
      currencies
        .filter((currency) => currency.code)
        .map((currency) => ({
          value: currency.code as string,
          label: currencyLabel(currency)
        })),
    [currencies]
  );

  const debitsTotal = useMemo(() => sumEntries(entries, 'debit'), [entries]);
  const creditsTotal = useMemo(() => sumEntries(entries, 'credit'), [entries]);

  const totalsBalanced =
    debitsTotal.gt(0) && creditsTotal.gt(0) && debitsTotal.equals(creditsTotal);

  function handleRetrieve() {
    const parsedOfficeId = Number(officeId);
    if (!Number.isFinite(parsedOfficeId) || parsedOfficeId <= 0) {
      setFieldErrors({ officeId: 'Office is required.' });
      setRetrieveError('Select an office before retrieving opening balances.');
      return;
    }

    setRetrieveError(null);
    setSubmitError(null);
    setFieldErrors({});
    startRetrieve(async () => {
      const result = await fetchOpeningBalanceTemplateAction(parsedOfficeId);
      if (isFetchError(result)) {
        setRetrieveError(result.message);
        toastFineractError(result.message);
        return;
      }

      setTemplate(result);
      setEntries(emptyEntries(result.glAccounts));
      if (!currencyCode && currencyOptions[0]) {
        setCurrencyCode(currencyOptions[0].value);
      }
    });
  }

  function updateEntry(
    glAccountId: number,
    side: 'debit' | 'credit',
    value: string
  ) {
    setEntries((current) => ({
      ...current,
      [glAccountId]: {
        ...current[glAccountId],
        [side]: value,
        ...(side === 'debit' && value ? { credit: '' } : {}),
        ...(side === 'credit' && value ? { debit: '' } : {})
      }
    }));
  }

  function handleSubmit() {
    if (submitPending || !canDefine || !template) {
      return;
    }

    const payload: DefineOpeningBalanceInput = {
      officeId: Number(officeId),
      currencyCode: currencyCode ?? '',
      transactionDate,
      glAccountEntries: template.glAccounts.map((account) => ({
        glAccountId: account.glAccountId,
        debit: entries[account.glAccountId]?.debit,
        credit: entries[account.glAccountId]?.credit
      })),
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    };

    setSubmitError(null);
    const parsed = validateDefineOpeningBalance(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.length ? issue.path.join('.') : 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    setFieldErrors({});
    startSubmit(async () => {
      const result = await defineOpeningBalanceAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toastFineractError(result.message);
        return;
      }

      const transactionId = result.transactionId;
      toast.success(
        transactionId
          ? `Opening balances saved. Transaction ${transactionId}.`
          : 'Opening balances saved.'
      );
      setTemplate(null);
      setEntries({});
      setTransactionDate('');
      router.push('/accounting');
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Migrate opening balances"
      description="Define office-wide opening balances by retrieving GL accounts, then entering matching debit and credit amounts."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          id={formId}
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <SelectField
                id={`${formId}-office`}
                label="Office"
                value={officeId}
                onValueChange={setOfficeId}
                options={officeOptions}
                placeholder="Select office"
                error={fieldErrors.officeId}
                required
                disabled={retrievePending || submitPending}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={retrievePending || submitPending || !officeId}
              onClick={handleRetrieve}
            >
              <Download className="mr-2 size-4" />
              Retrieve
            </Button>
          </div>

          {retrieveError ? <p className="text-sm text-destructive">{retrieveError}</p> : null}

          {template ? (
            <div className="space-y-6 border-t border-border pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Opening balances contra account
                  </p>
                  <p className="text-sm">{contraAccountLabel(template.contraAccount)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  id={`${formId}-currency`}
                  label="Currency"
                  value={currencyCode}
                  onValueChange={setCurrencyCode}
                  options={currencyOptions}
                  placeholder="Select currency"
                  error={fieldErrors.currencyCode}
                  required
                  disabled={submitPending || !canDefine}
                />
                <TransactionDateField
                  id={`${formId}-transaction-date`}
                  label="Opening balances date"
                  value={transactionDate}
                  onChange={(date) => setTransactionDate(date ?? '')}
                  error={fieldErrors.transactionDate}
                  required
                  disabled={submitPending || !canDefine}
                />
              </div>

              <div className="overflow-x-auto rounded-md border border-border">
                <div className="min-w-[56rem]">
                  <div className="grid grid-cols-[minmax(5rem,8%)_minmax(6rem,14%)_minmax(10rem,28%)_minmax(10rem,22%)_minmax(10rem,22%)] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium">
                    <div>Type</div>
                    <div>GL code</div>
                    <div>GL account name</div>
                    <div className="text-right">
                      Total debit:{' '}
                      {formatMoney(debitsTotal, currencyCode ?? '', FINERACT_LOCALE) ?? '—'}
                    </div>
                    <div className="text-right">
                      Total credit:{' '}
                      {formatMoney(creditsTotal, currencyCode ?? '', FINERACT_LOCALE) ?? '—'}
                    </div>
                  </div>

                  {template.glAccounts.map((account, index) => {
                    const previousType = template.glAccounts[index - 1]?.glAccountType.value;
                    const showType = account.glAccountType.value !== previousType;
                    const entry = entries[account.glAccountId] ?? { debit: '', credit: '' };
                    const rowKey = account.glAccountId;

                    return (
                      <div
                        key={rowKey}
                        className="grid grid-cols-[minmax(5rem,8%)_minmax(6rem,14%)_minmax(10rem,28%)_minmax(10rem,22%)_minmax(10rem,22%)] items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
                      >
                        <div className="pt-2 text-sm text-muted-foreground">
                          {showType ? glAccountTypeLabel(account.glAccountType.value) : ''}
                        </div>
                        <div className="pt-2 text-sm tabular-nums">{account.glAccountCode}</div>
                        <div className="pt-2 text-sm">{account.glAccountName}</div>
                        <MoneyField
                          id={`${formId}-debit-${rowKey}`}
                          label="Debit"
                          value={entry.debit}
                          onChange={(value) => updateEntry(account.glAccountId, 'debit', value)}
                          currencyCode={currencyCode}
                          disabled={submitPending || !canDefine}
                        />
                        <MoneyField
                          id={`${formId}-credit-${rowKey}`}
                          label="Credit"
                          value={entry.credit}
                          onChange={(value) => updateEntry(account.glAccountId, 'credit', value)}
                          currencyCode={currencyCode}
                          disabled={submitPending || !canDefine}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {fieldErrors.glAccountEntries ? (
                <p className="text-sm text-destructive">{fieldErrors.glAccountEntries}</p>
              ) : null}

              {!totalsBalanced && (debitsTotal.gt(0) || creditsTotal.gt(0)) ? (
                <p className="text-sm text-muted-foreground">
                  Total debits must equal total credits before you can submit.
                </p>
              ) : null}

              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

              <div className="flex flex-wrap gap-2">
                <Link href="/accounting" className={cn(buttonVariants({ variant: 'outline' }))}>
                  Cancel
                </Link>
                <Can permission="DEFINEOPENINGBALANCE_JOURNALENTRY">
                  <Button
                    type="submit"
                    disabled={
                      submitPending ||
                      !canDefine ||
                      !currencyCode ||
                      !transactionDate ||
                      !totalsBalanced
                    }
                  >
                    Submit
                  </Button>
                </Can>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </ListPage>
  );
}
