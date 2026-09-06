'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  fetchClientDepositAccountTemplateAction,
  loadClientDepositAccountEditSheetDataAction,
  updateClientDepositAccountAction
} from '@/actions/client-deposit-account';
import {
  applyDepositTemplateDefaults,
  emptyDepositForm,
  type DepositFormState
} from '@/components/clients/accounts/create-client-deposit-account-form-state';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { isClientDepositAccountTemplate } from '@/lib/fineract/client-account-action-result';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import {
  depositAccountKindTitle,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import { clampDateToProductWindow } from '@/lib/fineract/product-availability-dates';
import { toSelectOptions } from '@/lib/form/select-options';

const EDIT_FORM_ID = 'edit-client-deposit-account-form';

export function EditClientDepositAccountSheet({
  kind,
  clientId,
  accountId,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const initialTransactionDate = useInitialTransactionDate();
  const [template, setTemplate] = useState<ClientDepositAccountTemplate>({});
  const [form, setForm] = useState<DepositFormState>(() => emptyDepositForm(initialTransactionDate));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, startLoadTemplate] = useTransition();

  const productSelected = Boolean(form.productId);
  const currencyCode = productSelected ? template.currency?.code : undefined;
  const wideSheet = kind === 'recurringDeposit';
  const showDepositTerms = productSelected && Boolean(currencyCode);
  const title = `Modify ${depositAccountKindTitle(kind).toLowerCase()}`;

  const productOptions = useMemo(
    () => toSelectOptions(template.productOptions),
    [template.productOptions]
  );
  const officerOptions = useMemo(
    () => toSelectOptions(template.fieldOfficerOptions),
    [template.fieldOfficerOptions]
  );
  const periodFrequencyOptions = useMemo(
    () => toSelectOptions(template.periodFrequencyTypeOptions),
    [template.periodFrequencyTypeOptions]
  );
  const recurringFrequencyTypeOptions = useMemo(
    () =>
      toSelectOptions(
        template.recurringFrequencyTypeOptions ?? template.periodFrequencyTypeOptions
      ),
    [template.recurringFrequencyTypeOptions, template.periodFrequencyTypeOptions]
  );

  const loadProductTemplate = useCallback(
    (productId: string, preserveValues = false) => {
      startLoadTemplate(async () => {
        const result = await fetchClientDepositAccountTemplateAction(
          kind,
          clientId,
          productId || undefined
        );
        if (!isClientDepositAccountTemplate(result)) {
          return;
        }
        setTemplate(result);
        setForm((current) => {
          const defaults = applyDepositTemplateDefaults(result, kind);
          const next = preserveValues
            ? {
                ...current,
                depositPeriodFrequencyId:
                  current.depositPeriodFrequencyId || defaults.depositPeriodFrequencyId || '',
                recurringFrequencyType:
                  current.recurringFrequencyType || defaults.recurringFrequencyType || ''
              }
            : { ...current, ...defaults };
          return {
            ...next,
            submittedOnDate: clampDateToProductWindow(
              next.submittedOnDate || current.submittedOnDate,
              result.startDate,
              result.closeDate,
              FINERACT_DATE_FORMAT
            )
          };
        });
      });
    },
    [kind, clientId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSubmitError(null);
    setFieldErrors({});
    void loadClientDepositAccountEditSheetDataAction(kind, String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }
      setTemplate(result.template);
      setForm(result.form);
      if (result.form.productId) {
        loadProductTemplate(result.form.productId, true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, kind, accountId, loadProductTemplate]);

  const productStartDate = useMemo(
    () => fineractDateToDate(template.startDate, FINERACT_DATE_FORMAT),
    [template.startDate]
  );
  const productCloseDate = useMemo(
    () => fineractDateToDate(template.closeDate, FINERACT_DATE_FORMAT),
    [template.closeDate]
  );

  function patchForm(patch: Partial<DepositFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleProductChange(value: string) {
    patchForm({
      productId: value,
      depositAmount: '',
      depositPeriod: '',
      depositPeriodFrequencyId: '',
      recurringFrequency: '',
      recurringFrequencyType: '',
      mandatoryRecommendedDepositAmount: ''
    });
    if (value) {
      loadProductTemplate(value);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload =
        kind === 'fixedDeposit'
          ? {
              productId: form.productId,
              submittedOnDate: form.submittedOnDate,
              depositAmount: form.depositAmount,
              depositPeriod: form.depositPeriod,
              depositPeriodFrequencyId: form.depositPeriodFrequencyId,
              externalId: form.externalId,
              fieldOfficerId: form.fieldOfficerId
            }
          : {
              productId: form.productId,
              submittedOnDate: form.submittedOnDate,
              depositAmount: form.depositAmount,
              depositPeriod: form.depositPeriod,
              depositPeriodFrequencyId: form.depositPeriodFrequencyId,
              recurringFrequency: form.recurringFrequency,
              recurringFrequencyType: form.recurringFrequencyType,
              mandatoryRecommendedDepositAmount: form.mandatoryRecommendedDepositAmount,
              isCalendarInherited: form.isCalendarInherited,
              externalId: form.externalId,
              fieldOfficerId: form.fieldOfficerId
            };

      const result = await updateClientDepositAccountAction(
        kind,
        clientId,
        String(accountId),
        payload
      );
      if (
        !toastCommandOutcome(result, {
          completed: 'Application updated.'
        })
      ) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  const disabled = pending || loading || loadingTemplate;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Update this pending application before approval."
      formId={EDIT_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
      submitDisabled={disabled || !productSelected}
      className={
        wideSheet
          ? 'data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl'
          : undefined
      }
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formatActionErrorMessage(submitError, fieldErrors)}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading application…</p>
      ) : (
        <form id={EDIT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            label="Product"
            required
            value={form.productId || undefined}
            onValueChange={(value) => handleProductChange(value ?? '')}
            options={productOptions}
            placeholder="Select product"
            disabled={disabled}
            error={fieldErrors.productId}
            emptyMessage="No products available."
          />
          <TransactionDateField
            id="edit-deposit-submitted-on"
            label="Submitted on"
            required
            dateFormat={FINERACT_DATE_FORMAT}
            value={form.submittedOnDate}
            onChange={(submittedOnDate) => patchForm({ submittedOnDate })}
            disabled={disabled}
            error={fieldErrors.submittedOnDate}
            fromDate={productSelected ? productStartDate : undefined}
            toDate={productSelected ? productCloseDate : undefined}
          />
          {!productSelected ? (
            <p className="text-sm text-muted-foreground">
              Select a product first — amount fields use the product currency.
            </p>
          ) : null}
          {showDepositTerms ? (
            <>
              <MoneyField
                id="edit-deposit-amount"
                label="Deposit amount"
                required
                currencyCode={currencyCode!}
                value={form.depositAmount}
                onChange={(depositAmount) => patchForm({ depositAmount })}
                disabled={disabled}
                error={fieldErrors.depositAmount}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumericField
                  id="edit-deposit-period"
                  label="Deposit period"
                  required
                  integer
                  value={form.depositPeriod}
                  onChange={(depositPeriod) => patchForm({ depositPeriod })}
                  disabled={disabled}
                  error={fieldErrors.depositPeriod}
                />
                <SelectField
                  label="Period frequency"
                  required
                  value={form.depositPeriodFrequencyId || undefined}
                  onValueChange={(value) => patchForm({ depositPeriodFrequencyId: value ?? '' })}
                  options={periodFrequencyOptions}
                  placeholder="Select frequency"
                  disabled={disabled}
                  error={fieldErrors.depositPeriodFrequencyId}
                />
              </div>
            </>
          ) : null}
          {kind === 'recurringDeposit' && showDepositTerms ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumericField
                  id="edit-recurring-frequency"
                  label="Recurring frequency"
                  required
                  integer
                  value={form.recurringFrequency}
                  onChange={(recurringFrequency) => patchForm({ recurringFrequency })}
                  disabled={disabled}
                  error={fieldErrors.recurringFrequency}
                />
                <SelectField
                  label="Recurring frequency type"
                  required
                  value={form.recurringFrequencyType || undefined}
                  onValueChange={(value) => patchForm({ recurringFrequencyType: value ?? '' })}
                  options={recurringFrequencyTypeOptions}
                  placeholder="Select type"
                  disabled={disabled}
                  error={fieldErrors.recurringFrequencyType}
                />
              </div>
              <MoneyField
                id="edit-mandatory-recommended-deposit"
                label="Recommended deposit amount"
                required
                currencyCode={currencyCode!}
                value={form.mandatoryRecommendedDepositAmount}
                onChange={(mandatoryRecommendedDepositAmount) =>
                  patchForm({ mandatoryRecommendedDepositAmount })
                }
                disabled={disabled}
                error={fieldErrors.mandatoryRecommendedDepositAmount}
              />
              <SwitchField
                id="edit-is-calendar-inherited"
                label="Inherit calendar from product"
                checked={form.isCalendarInherited}
                onCheckedChange={(isCalendarInherited) => patchForm({ isCalendarInherited })}
                disabled={disabled}
              />
            </>
          ) : null}
          <SelectField
            label="Field officer"
            optional
            value={form.fieldOfficerId || undefined}
            onValueChange={(value) => patchForm({ fieldOfficerId: value ?? '' })}
            options={officerOptions}
            placeholder="Optional"
            disabled={disabled}
            error={fieldErrors.fieldOfficerId}
          />
          <TextField
            id="edit-deposit-external-id"
            label="External ID"
            optional
            value={form.externalId}
            onChange={(externalId) => patchForm({ externalId })}
            disabled={disabled}
            error={fieldErrors.externalId}
          />
        </form>
      )}
    </FormSheet>
  );
}
