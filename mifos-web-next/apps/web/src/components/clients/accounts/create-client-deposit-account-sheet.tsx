'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, ClientDepositAccountTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  createClientDepositAccountAction,
  fetchClientDepositAccountTemplateAction
} from '@/actions/client-deposit-account';
import {
  applyDepositTemplateDefaults,
  buildSavingsFormPayload,
  clearSavingsAdvancedFields,
  emptyDepositForm,
  type DepositFormState
} from '@/components/clients/accounts/create-client-deposit-account-form-state';
import { CreateClientSavingsAccountAdvancedFields } from '@/components/clients/accounts/create-client-savings-account-advanced-fields';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isClientDepositAccountTemplate } from '@/lib/fineract/client-account-action-result';
import { CLIENT_DEPOSIT_ACCOUNT_CONFIG } from '@/lib/fineract/client-deposit-account-config';
import { FINERACT_DATE_FORMAT, toFineractDate } from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';

export const CREATE_CLIENT_DEPOSIT_ACCOUNT_FORM_ID = 'create-client-deposit-account-form';

export function CreateClientDepositAccountSheet({
  clientId,
  kind,
  initialTemplate,
  open,
  onOpenChange,
  onCreated
}: {
  clientId: string;
  kind: ClientDepositAccountKind;
  initialTemplate: ClientDepositAccountTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const config = CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind];
  const [template, setTemplate] = useState(initialTemplate);
  const [form, setForm] = useState<DepositFormState>(() => ({
    ...emptyDepositForm(),
    submittedOnDate: toFineractDate()
  }));
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingTemplate, startLoadTemplate] = useTransition();

  const productSelected = Boolean(form.productId);
  const currencyCode = productSelected ? template.currency?.code : undefined;
  const wideSheet = kind === 'recurringDeposit';
  const showDepositTerms = kind !== 'savings' && productSelected && Boolean(currencyCode);
  const useTabs = kind === 'savings';

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

  const loadTemplate = useCallback(
    (productId: string) => {
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
        setForm((current) => ({
          ...current,
          ...applyDepositTemplateDefaults(result, kind)
        }));
      });
    },
    [kind, clientId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setTemplate(initialTemplate);
    setForm({ ...emptyDepositForm(), submittedOnDate: toFineractDate() });
    setActiveTab('basic');
    setFieldErrors({});
    setSubmitError(null);
    startTransition(async () => {
      const result = await fetchClientDepositAccountTemplateAction(kind, clientId);
      if (isClientDepositAccountTemplate(result)) {
        setTemplate(result);
      }
    });
  }, [open, initialTemplate, kind, clientId]);

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
      mandatoryRecommendedDepositAmount: '',
      ...(kind === 'savings' ? clearSavingsAdvancedFields() : {})
    });
    if (value) {
      loadTemplate(value);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload =
        kind === 'savings'
          ? buildSavingsFormPayload(form)
          : kind === 'fixedDeposit'
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

      const result = await createClientDepositAccountAction(kind, clientId, payload);
      if (!toastCommandOutcome(result, {
        completed: 'Application submitted.',
        pending: 'Application sent for approval.'
      })) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      onOpenChange(false);
      onCreated?.();
      router.refresh();
    });
  }

  const disabled = pending || loadingTemplate;

  const basicFields = (
    <div className="space-y-4">
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

      <DateField
        id="deposit-submitted-on"
        label="Submitted on"
        required
        dateFormat={FINERACT_DATE_FORMAT}
        value={form.submittedOnDate}
        onChange={(submittedOnDate) => patchForm({ submittedOnDate: submittedOnDate ?? '' })}
        disabled={disabled}
        error={fieldErrors.submittedOnDate}
      />

      {kind === 'savings' ? (
        <SelectField
          label="Field officer"
          required
          value={form.fieldOfficerId || undefined}
          onValueChange={(value) => patchForm({ fieldOfficerId: value ?? '' })}
          options={officerOptions}
          placeholder="Select field officer"
          disabled={disabled}
          error={fieldErrors.fieldOfficerId}
          emptyMessage="No field officers available."
        />
      ) : null}

      {kind !== 'savings' && !productSelected ? (
        <p className="text-sm text-muted-foreground">
          Select a product first — amount fields use the product currency.
        </p>
      ) : null}

      {kind !== 'savings' && productSelected && !currencyCode && !loadingTemplate ? (
        <p className="text-sm text-muted-foreground">Loading product details…</p>
      ) : null}

      {showDepositTerms ? (
        <>
          <MoneyField
            id="deposit-amount"
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
              id="deposit-period"
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
              id="recurring-frequency"
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
            id="mandatory-recommended-deposit"
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
            id="is-calendar-inherited"
            label="Inherit calendar from product"
            checked={form.isCalendarInherited}
            onCheckedChange={(isCalendarInherited) => patchForm({ isCalendarInherited })}
            disabled={disabled}
          />
        </>
      ) : null}
    </div>
  );

  const advancedFields =
    kind === 'savings' ? (
      <CreateClientSavingsAccountAdvancedFields
        form={form}
        template={template}
        productSelected={productSelected}
        disabled={disabled}
        fieldErrors={fieldErrors}
        onPatch={patchForm}
      />
    ) : (
      <div className="space-y-4">
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
          id="deposit-external-id"
          label="External ID"
          optional
          value={form.externalId}
          onChange={(externalId) => patchForm({ externalId })}
          disabled={disabled}
          error={fieldErrors.externalId}
        />
      </div>
    );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={config.sheetTitle}
      description={config.sheetDescription}
      formId={CREATE_CLIENT_DEPOSIT_ACCOUNT_FORM_ID}
      submitLabel={config.submitLabel}
      submitLoading={pending}
      submitDisabled={disabled || productOptions.length === 0}
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
      <form id={CREATE_CLIENT_DEPOSIT_ACCOUNT_FORM_ID} onSubmit={handleSubmit}>
        {useTabs ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="basic" className="flex-1">
                Basic
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">
                Advanced
              </TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="mt-0">
              {basicFields}
            </TabsContent>
            <TabsContent value="advanced" className="mt-0">
              {advancedFields}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {basicFields}
            <div className="space-y-2">
              <p className="text-sm font-medium">Advanced</p>
              {advancedFields}
            </div>
          </div>
        )}
      </form>
    </FormSheet>
  );
}
