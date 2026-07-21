'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  fetchShareAccountForModifyAction,
  updateShareAccountAction
} from '@/actions/share-account';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { isShareAccountActionError } from '@/lib/fineract/share-account-action-result';
import { SHARE_ACCOUNT_UPDATE_TOAST } from '@/lib/fineract/share-account-command-toasts';
import { toSelectOptions } from '@/lib/form/select-options';

const FORM_ID = 'modify-share-account-form';

function dateToFormValue(value: number[] | string | undefined): string {
  return fineractApiDateToFormString(value) ?? '';
}

export function ShareAccountModifySheet({
  open,
  onOpenChange,
  clientId,
  account
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  account: FineractShareAccountDetail;
}) {
  const router = useRouter();
  const [editable, setEditable] = useState<FineractShareAccountDetail>(account);
  const [productId, setProductId] = useState(String(account.productId ?? ''));
  const [submittedDate, setSubmittedDate] = useState(
    dateToFormValue(account.timeline?.submittedOnDate)
  );
  const [externalId, setExternalId] = useState(account.externalId ?? '');
  const [requestedShares, setRequestedShares] = useState(
    String(account.summary?.totalPendingForApprovalShares ?? account.defaultShares ?? '')
  );
  const [savingsAccountId, setSavingsAccountId] = useState(String(account.savingsAccountId ?? ''));
  const [applicationDate, setApplicationDate] = useState(
    dateToFormValue(account.timeline?.submittedOnDate)
  );
  const [minimumActivePeriod, setMinimumActivePeriod] = useState(
    account.minimumActivePeriod != null ? String(account.minimumActivePeriod) : ''
  );
  const [minimumActivePeriodFrequencyType, setMinimumActivePeriodFrequencyType] = useState(
    account.minimumActivePeriodTypeEnum?.id != null
      ? String(account.minimumActivePeriodTypeEnum.id)
      : ''
  );
  const [lockinPeriodFrequency, setLockinPeriodFrequency] = useState(
    account.lockinPeriod != null ? String(account.lockinPeriod) : ''
  );
  const [lockinPeriodFrequencyType, setLockinPeriodFrequencyType] = useState(
    account.lockPeriodTypeEnum?.id != null ? String(account.lockPeriodTypeEnum.id) : ''
  );
  const [allowDividends, setAllowDividends] = useState(
    account.allowDividendCalculationForInactiveClients === true
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [loading, startLoad] = useTransition();

  const productOptions = useMemo(
    () => toSelectOptions(editable.productOptions),
    [editable.productOptions]
  );
  const savingsOptions = useMemo(
    () =>
      (editable.clientSavingsAccounts ?? []).map((row) => ({
        value: String(row.id),
        label: [row.accountNo, row.productName].filter(Boolean).join(' · ') || String(row.id)
      })),
    [editable.clientSavingsAccounts]
  );
  const frequencyOptions = useMemo(
    () => toSelectOptions(editable.lockinPeriodFrequencyTypeOptions),
    [editable.lockinPeriodFrequencyTypeOptions]
  );
  const minActiveOptions = useMemo(
    () =>
      toSelectOptions(
        editable.minimumActivePeriodFrequencyTypeOptions ??
          editable.lockinPeriodFrequencyTypeOptions
      ),
    [editable.minimumActivePeriodFrequencyTypeOptions, editable.lockinPeriodFrequencyTypeOptions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setEditable(account);
    setProductId(String(account.productId ?? ''));
    setSubmittedDate(dateToFormValue(account.timeline?.submittedOnDate));
    setExternalId(account.externalId ?? '');
    setRequestedShares(
      String(account.summary?.totalPendingForApprovalShares ?? account.defaultShares ?? '')
    );
    setSavingsAccountId(String(account.savingsAccountId ?? ''));
    setApplicationDate(dateToFormValue(account.timeline?.submittedOnDate));
    setMinimumActivePeriod(
      account.minimumActivePeriod != null ? String(account.minimumActivePeriod) : ''
    );
    setMinimumActivePeriodFrequencyType(
      account.minimumActivePeriodTypeEnum?.id != null
        ? String(account.minimumActivePeriodTypeEnum.id)
        : ''
    );
    setLockinPeriodFrequency(account.lockinPeriod != null ? String(account.lockinPeriod) : '');
    setLockinPeriodFrequencyType(
      account.lockPeriodTypeEnum?.id != null ? String(account.lockPeriodTypeEnum.id) : ''
    );
    setAllowDividends(account.allowDividendCalculationForInactiveClients === true);
    setError(null);
    setFieldErrors({});
    startLoad(async () => {
      const result = await fetchShareAccountForModifyAction(String(account.id));
      if (isShareAccountActionError(result) || !('id' in result)) {
        return;
      }
      setEditable(result);
      setProductId(String(result.productId ?? ''));
      setSubmittedDate(dateToFormValue(result.timeline?.submittedOnDate));
      setExternalId(result.externalId ?? '');
      setRequestedShares(
        String(result.summary?.totalPendingForApprovalShares ?? result.defaultShares ?? '')
      );
      setSavingsAccountId(String(result.savingsAccountId ?? ''));
      setMinimumActivePeriod(
        result.minimumActivePeriod != null ? String(result.minimumActivePeriod) : ''
      );
      setMinimumActivePeriodFrequencyType(
        result.minimumActivePeriodTypeEnum?.id != null
          ? String(result.minimumActivePeriodTypeEnum.id)
          : ''
      );
      setLockinPeriodFrequency(result.lockinPeriod != null ? String(result.lockinPeriod) : '');
      setLockinPeriodFrequencyType(
        result.lockPeriodTypeEnum?.id != null ? String(result.lockPeriodTypeEnum.id) : ''
      );
      setAllowDividends(result.allowDividendCalculationForInactiveClients === true);
    });
  }, [open, account]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateShareAccountAction(clientId, String(account.id), {
        productId,
        submittedDate,
        externalId,
        requestedShares,
        savingsAccountId,
        applicationDate,
        minimumActivePeriod,
        minimumActivePeriodFrequencyType,
        lockinPeriodFrequency,
        lockinPeriodFrequencyType,
        allowDividendCalculationForInactiveClients: allowDividends,
        charges: (editable.charges ?? [])
          .filter((charge) => charge.chargeId != null && charge.amount != null)
          .map((charge) => ({
            chargeId: charge.chargeId!,
            amount: charge.amount!
          }))
      });
      if (!toastCommandOutcome(result, SHARE_ACCOUNT_UPDATE_TOAST)) {
        if (!result.ok) {
          setError(formatActionErrorMessage(result.message, result.fieldErrors));
          setFieldErrors(result.fieldErrors ?? {});
        }
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Modify application"
      description="Update this pending share account application."
      formId={FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending || loading}
      className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
    >
      {error ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form id={FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        <SelectField
          label="Share product"
          value={productId}
          onValueChange={(value) => setProductId(value ?? '')}
          options={
            productOptions.length
              ? productOptions
              : editable.productId && editable.productName
                ? [{ value: String(editable.productId), label: editable.productName }]
                : []
          }
          error={fieldErrors.productId}
          required
        />
        <TransactionDateField
          label="Submitted on"
          value={submittedDate}
          onChange={setSubmittedDate}
          error={fieldErrors.submittedDate}
          required
        />
        <NumericField
          label="Requested shares"
          value={requestedShares}
          onChange={setRequestedShares}
          error={fieldErrors.requestedShares}
          required
        />
        <SelectField
          label="Linked savings account"
          value={savingsAccountId}
          onValueChange={(value) => setSavingsAccountId(value ?? '')}
          options={
            savingsOptions.length
              ? savingsOptions
              : editable.savingsAccountId
                ? [
                    {
                      value: String(editable.savingsAccountId),
                      label: editable.savingsAccountNumber ?? String(editable.savingsAccountId)
                    }
                  ]
                : []
          }
          error={fieldErrors.savingsAccountId}
          required
        />
        <TransactionDateField
          label="Application date"
          value={applicationDate}
          onChange={setApplicationDate}
          error={fieldErrors.applicationDate}
          required
        />
        <TextField
          label="External ID"
          value={externalId}
          onChange={setExternalId}
          error={fieldErrors.externalId}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            label="Minimum active period"
            value={minimumActivePeriod}
            onChange={setMinimumActivePeriod}
            error={fieldErrors.minimumActivePeriod}
          />
          <SelectField
            label="Minimum active period type"
            value={minimumActivePeriodFrequencyType}
            onValueChange={(value) => setMinimumActivePeriodFrequencyType(value ?? '')}
            options={minActiveOptions}
            error={fieldErrors.minimumActivePeriodFrequencyType}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            label="Lock-in period"
            value={lockinPeriodFrequency}
            onChange={setLockinPeriodFrequency}
            error={fieldErrors.lockinPeriodFrequency}
          />
          <SelectField
            label="Lock-in period type"
            value={lockinPeriodFrequencyType}
            onValueChange={(value) => setLockinPeriodFrequencyType(value ?? '')}
            options={frequencyOptions}
            error={fieldErrors.lockinPeriodFrequencyType}
          />
        </div>
        <SwitchField
          label="Allow dividends for inactive clients"
          checked={allowDividends}
          onCheckedChange={setAllowDividends}
        />
      </form>
    </FormSheet>
  );
}
