'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AccountTransferTemplate, FineractSavingsAccountDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createSavingsAccountTransferAction,
  fetchAccountTransferTemplateAction,
  loadSavingsAccountTransferSheetAction,
  resolveTransferBeneficiaryClientAction,
  searchTransferBeneficiaryClientsAction
} from '@/actions/account-transfer';
import { isAccountTransferActionError } from '@/lib/fineract/account-transfer-action-result';
import {
  ContextHelpFieldHint,
  ContextHelpPanel,
  ContextHelpProvider
} from '@/components/composites/context-help';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { dateToFineract } from '@/lib/fineract/date-input';
import { SAVINGS_PORTFOLIO_ACCOUNT_TYPE } from '@/lib/fineract/portfolio-account-types';
import {
  formatSavingsAccountMoney,
  savingsAccountAvailableBalance
} from '@/lib/fineract/savings-account-display';
import type { TransferBeneficiaryClientResolved } from '@/lib/fineract/transfer-beneficiary-clients.types';
import { savingsAccountTransferFundsHelp } from '@/lib/context-help/pages/savings-account-transfer-funds';

export const SAVINGS_ACCOUNT_TRANSFER_FORM_ID = 'savings-account-transfer-form';

const PANEL_CLASS =
  'data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl';

const CLIENT_SEARCH_DEBOUNCE_MS = 400;

const TO_SAVINGS_ACCOUNT_TYPE = String(SAVINGS_PORTFOLIO_ACCOUNT_TYPE);

type BeneficiaryFormState = {
  toOfficeId: string;
  toClientId: string;
  toAccountType: string;
  toAccountId: string;
};

const EMPTY_BENEFICIARY: BeneficiaryFormState = {
  toOfficeId: '',
  toClientId: '',
  toAccountType: '',
  toAccountId: ''
};

function beneficiaryToCascade(form: BeneficiaryFormState): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  for (const [key, value] of Object.entries(form)) {
    if (value !== '') {
      out[key] = value;
    }
  }
  return out;
}

function clientOptionLabel(client: {
  displayName: string;
  accountNo?: string;
  officeName?: string;
}): string {
  const parts = [client.displayName];
  if (client.accountNo) {
    parts.push(`#${client.accountNo}`);
  }
  if (client.officeName) {
    parts.push(`(${client.officeName})`);
  }
  return parts.join(' ');
}

export function SavingsAccountTransferFundsSheet({
  clientId,
  account,
  currencyCode,
  open,
  onOpenChange
}: {
  clientId: string;
  account: FineractSavingsAccountDetail;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<AccountTransferTemplate | null>(null);
  const availableBalance = savingsAccountAvailableBalance(account);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryFormState>(EMPTY_BENEFICIARY);
  const [selectedClient, setSelectedClient] = useState<TransferBeneficiaryClientResolved | null>(
    null
  );
  const [clientSearch, setClientSearch] = useState('');
  const [debouncedClientSearch, setDebouncedClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<
    Array<{ value: string; label: string; keywords?: string[] }>
  >([]);
  const [clientPickerId, setClientPickerId] = useState<string | undefined>();
  const [transferDate, setTransferDate] = useState<string | undefined>(() =>
    dateToFineract(new Date())
  );
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [clientSearchError, setClientSearchError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [loadingClients, startClientSearch] = useTransition();
  const [resolvingClient, startResolveClient] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipCascadeRef = useRef(false);
  const lastCascadeKeyRef = useRef('');
  const cascadeRequestIdRef = useRef(0);

  const loadTemplate = useCallback(
    (nextBeneficiary: BeneficiaryFormState) => {
      const cascadeKey = JSON.stringify(beneficiaryToCascade(nextBeneficiary));
      if (cascadeKey === lastCascadeKeyRef.current) {
        return;
      }
      lastCascadeKeyRef.current = cascadeKey;

      const requestId = ++cascadeRequestIdRef.current;
      startRefresh(async () => {
        const result = await fetchAccountTransferTemplateAction({
          fromAccountId: account.id,
          cascade: beneficiaryToCascade(nextBeneficiary)
        });
        if (requestId !== cascadeRequestIdRef.current) {
          return;
        }
        if (isAccountTransferActionError(result)) {
          setTemplateLoadError(result.message);
          return;
        }
        setTemplateLoadError(null);
        setTemplate(result);
      });
    },
    [account.id]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setBeneficiary(EMPTY_BENEFICIARY);
    setSelectedClient(null);
    setClientSearch('');
    setDebouncedClientSearch('');
    setClientOptions([]);
    setClientPickerId(undefined);
    setTransferAmount('');
    setTransferDescription('');
    setFieldErrors({});
    setSubmitError(null);
    setTemplateLoadError(null);
    setInitialLoadError(null);
    setClientSearchError(null);
    setTemplate(null);
    skipCascadeRef.current = true;
    lastCascadeKeyRef.current = '';
    cascadeRequestIdRef.current += 1;

    let cancelled = false;
    setLoadingInitial(true);

    void loadSavingsAccountTransferSheetAction(account.id).then((result) => {
      if (cancelled) {
        return;
      }
      setLoadingInitial(false);
      if (!result.ok) {
        setInitialLoadError(result.message);
        return;
      }
      setTemplate(result.template);
      const defaultDate = dateToFineract(new Date(), result.template.dateFormat);
      setTransferDate(defaultDate);
    });

    return () => {
      cancelled = true;
    };
  }, [open, account.id]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedClientSearch(clientSearch),
      CLIENT_SEARCH_DEBOUNCE_MS
    );
    return () => window.clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (debouncedClientSearch.trim().length < 2) {
      setClientOptions([]);
      setClientSearchError(null);
      return;
    }

    startClientSearch(async () => {
      const result = await searchTransferBeneficiaryClientsAction(debouncedClientSearch);
      if (!result.ok) {
        setClientSearchError(result.message);
        setClientOptions([]);
        return;
      }
      setClientSearchError(null);
      setClientOptions(
        result.data.map((client) => ({
          value: String(client.id),
          label: clientOptionLabel(client),
          keywords: [client.accountNo, client.officeName].filter(
            (value): value is string => Boolean(value)
          )
        }))
      );
    });
  }, [open, debouncedClientSearch]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (skipCascadeRef.current) {
      skipCascadeRef.current = false;
      return;
    }
    const hasCascadeInput =
      beneficiary.toOfficeId &&
      beneficiary.toClientId &&
      beneficiary.toAccountType;
    if (!hasCascadeInput) {
      return;
    }
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(() => {
      loadTemplate(beneficiary);
    }, 300);
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [
    open,
    beneficiary.toOfficeId,
    beneficiary.toClientId,
    beneficiary.toAccountType,
    beneficiary.toAccountId,
    loadTemplate
  ]);

  function handleBeneficiaryClientSelect(nextClientId: string | undefined) {
    setClientPickerId(nextClientId);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.toClientId;
      delete next.toOfficeId;
      delete next.toAccountId;
      return next;
    });

    if (!nextClientId) {
      setSelectedClient(null);
      lastCascadeKeyRef.current = '';
      setBeneficiary(EMPTY_BENEFICIARY);
      return;
    }

    startResolveClient(async () => {
      const result = await resolveTransferBeneficiaryClientAction(nextClientId);
      if (!result.ok) {
        setClientSearchError(result.message);
        setSelectedClient(null);
        setBeneficiary(EMPTY_BENEFICIARY);
        return;
      }

      setClientSearchError(null);
      setSelectedClient(result.data);
      lastCascadeKeyRef.current = '';
      setBeneficiary({
        toOfficeId: String(result.data.officeId),
        toClientId: String(result.data.id),
        toAccountType: TO_SAVINGS_ACCOUNT_TYPE,
        toAccountId: ''
      });
    });
  }

  const destinationAccounts = useMemo(
    () =>
      (template?.toAccountOptions ?? []).filter((acct) => acct.id !== account.id).map((acct) => ({
        value: String(acct.id),
        label: [acct.productName, acct.accountNo].filter(Boolean).join(' — ')
      })),
    [template?.toAccountOptions, account.id]
  );

  const amountNum = transferAmount ? Number(transferAmount) : NaN;
  const amountExceedsBalance =
    Number.isFinite(amountNum) && amountNum > 0 && amountNum > availableBalance;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (!selectedClient) {
      setFieldErrors({ toClientId: 'Select a beneficiary customer.' });
      return;
    }

    if (amountExceedsBalance) {
      setFieldErrors({ transferAmount: 'Amount exceeds available balance.' });
      return;
    }

    startTransition(async () => {
      const result = await createSavingsAccountTransferAction(clientId, account.id, {
        ...beneficiary,
        toAccountType: TO_SAVINGS_ACCOUNT_TYPE,
        transferDate,
        transferAmount: amountNum,
        transferDescription
      });
      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toast.success('Transfer completed.');
      onOpenChange(false);
      router.refresh();
    });
  }

  const disabled = pending || refreshing || loadingInitial || resolvingClient;
  const fieldsDisabled =
    pending || loadingInitial || resolvingClient || Boolean(templateLoadError) || Boolean(initialLoadError);
  const submitDisabled =
    disabled || Boolean(templateLoadError) || Boolean(initialLoadError) || !template;
  const dateFormat = template?.dateFormat;

  const fromAccountLabel = template?.fromAccount
    ? [template.fromAccount.productName, template.fromAccount.accountNo]
        .filter(Boolean)
        .join(' — ')
    : null;

  return (
    <ContextHelpProvider content={savingsAccountTransferFundsHelp}>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Transfer funds"
        description="Search for a customer and transfer to one of their savings accounts."
        formId={SAVINGS_ACCOUNT_TRANSFER_FORM_ID}
        submitLabel="Transfer"
        submitLoading={pending}
        submitDisabled={submitDisabled}
        className={PANEL_CLASS}
      >
      {loadingInitial ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading transfer form…</p>
      ) : null}
      {initialLoadError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {initialLoadError}
        </p>
      ) : null}
      {refreshing && !templateLoadError ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading savings accounts…</p>
      ) : null}
      {templateLoadError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {templateLoadError}
        </p>
      ) : null}
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formatActionErrorMessage(submitError, fieldErrors)}
        </p>
      ) : null}

      {template ? (
        <form id={SAVINGS_ACCOUNT_TRANSFER_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium">Transfer from</h3>
              <ContextHelpFieldHint
                sectionId="transfer-from"
                fallbackHint="Source account and available balance for this transfer."
                ariaLabel="Help for transfer from"
              />
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Customer</dt>
                <dd>{template.fromClient?.displayName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Branch</dt>
                <dd>{template.fromOffice?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Account</dt>
                <dd>{fromAccountLabel ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Available balance</dt>
                <dd>{formatSavingsAccountMoney(account, availableBalance)}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium">Transfer to</h3>
            <div className="grid gap-4">
              <TextField
                id="transfer-beneficiary-search"
                label="Search customer"
                optional={false}
                value={clientSearch}
                onChange={setClientSearch}
                placeholder="Type at least 2 characters"
                disabled={fieldsDisabled}
                error={clientSearchError ?? undefined}
                contextHelpSectionId="beneficiary-search"
                hint="Type a name or account number to find customers across all branches."
                hintAriaLabel="Help for search customer"
              />
              <SelectField
                label="Beneficiary"
                required
                value={clientPickerId}
                onValueChange={handleBeneficiaryClientSelect}
                options={clientOptions}
                placeholder={
                  loadingClients
                    ? 'Searching…'
                    : clientOptions.length
                      ? 'Select customer'
                      : 'Search to find customers'
                }
                disabled={fieldsDisabled || clientOptions.length === 0}
                error={fieldErrors.toClientId}
                contextHelpSectionId="beneficiary"
                hint="The customer who receives the funds. Their branch is set automatically."
                hintAriaLabel="Help for beneficiary"
              />
              {selectedClient ? (
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">{selectedClient.displayName}</p>
                  <p className="text-muted-foreground">
                    Branch: {selectedClient.officeName ?? `Office #${selectedClient.officeId}`}
                  </p>
                  <p className="text-muted-foreground">Account type: Savings</p>
                </div>
              ) : null}
              <SelectField
                label="To savings account"
                required
                value={beneficiary.toAccountId || undefined}
                onValueChange={(v) =>
                  setBeneficiary((prev) => ({ ...prev, toAccountId: v ?? '' }))
                }
                options={destinationAccounts}
                placeholder={
                  !selectedClient
                    ? 'Select a customer first'
                    : refreshing
                      ? 'Loading accounts…'
                      : destinationAccounts.length
                        ? 'Select savings account'
                        : 'No other savings accounts'
                }
                disabled={fieldsDisabled || !selectedClient || destinationAccounts.length === 0}
                error={fieldErrors.toAccountId}
                contextHelpSectionId="destination-account"
                hint="Which of the beneficiary’s savings accounts should receive the money."
                hintAriaLabel="Help for destination savings account"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium">Transfer details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                id="transfer-date"
                label="Transfer date"
                required
                value={transferDate}
                onChange={setTransferDate}
                error={fieldErrors.transferDate}
                disabled={fieldsDisabled}
                dateFormat={dateFormat}
                contextHelpSectionId="transfer-date"
                hint="Business date when the transfer is recorded."
                hintAriaLabel="Help for transfer date"
              />
              <MoneyField
                id="transfer-amount"
                label="Amount"
                required
                currencyCode={currencyCode}
                value={transferAmount}
                onChange={setTransferAmount}
                error={
                  fieldErrors.transferAmount ??
                  (amountExceedsBalance ? 'Amount exceeds available balance.' : undefined)
                }
                disabled={fieldsDisabled}
                contextHelpSectionId="transfer-amount"
                hint="Must be greater than zero and not more than the available balance."
                hintAriaLabel="Help for transfer amount"
              />
              <div className="sm:col-span-2">
                <TextField
                  id="transfer-description"
                  label="Description"
                  required
                  value={transferDescription}
                  onChange={setTransferDescription}
                  error={fieldErrors.transferDescription}
                  disabled={fieldsDisabled}
                  contextHelpSectionId="transfer-description"
                  hint="Shown on the transaction history for both accounts."
                  hintAriaLabel="Help for transfer description"
                />
              </div>
            </div>
          </section>
        </form>
      ) : null}
      </FormSheet>
      <ContextHelpPanel />
    </ContextHelpProvider>
  );
}
