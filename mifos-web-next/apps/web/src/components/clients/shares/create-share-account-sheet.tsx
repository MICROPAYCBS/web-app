'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  createShareAccountAction,
  fetchShareAccountTemplateAction
} from '@/actions/share-account';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyValue } from '@/components/composites';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { isShareAccountTemplate } from '@/lib/fineract/share-account-action-result';
import { SHARE_ACCOUNT_CREATE_TOAST } from '@/lib/fineract/share-account-command-toasts';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { toSelectOptions } from '@/lib/form/select-options';

export const CREATE_SHARE_ACCOUNT_FORM_ID = 'create-share-account-form';

type ChargeRow = { chargeId: string; amount: string; name?: string };

type FormState = {
  productId: string;
  submittedDate: string;
  externalId: string;
  requestedShares: string;
  savingsAccountId: string;
  applicationDate: string;
  minimumActivePeriod: string;
  minimumActivePeriodFrequencyType: string;
  lockinPeriodFrequency: string;
  lockinPeriodFrequencyType: string;
  allowDividendCalculationForInactiveClients: boolean;
  charges: ChargeRow[];
};

function emptyForm(initialDate: string): FormState {
  return {
    productId: '',
    submittedDate: initialDate,
    externalId: '',
    requestedShares: '',
    savingsAccountId: '',
    applicationDate: initialDate,
    minimumActivePeriod: '',
    minimumActivePeriodFrequencyType: '',
    lockinPeriodFrequency: '',
    lockinPeriodFrequencyType: '',
    allowDividendCalculationForInactiveClients: false,
    charges: []
  };
}

function applyTemplateDefaults(
  template: FineractShareAccountTemplate,
  current: FormState
): Partial<FormState> {
  const productCharges = (template.charges ?? []).map((charge) => ({
    chargeId: String(charge.id),
    amount: String(charge.amount ?? charge.amountOrPercentage ?? ''),
    name: charge.name
  }));
  return {
    requestedShares:
      current.requestedShares ||
      (template.defaultShares != null ? String(template.defaultShares) : ''),
    minimumActivePeriod:
      current.minimumActivePeriod ||
      (template.minimumActivePeriod != null ? String(template.minimumActivePeriod) : ''),
    minimumActivePeriodFrequencyType:
      current.minimumActivePeriodFrequencyType ||
      (template.minimumActivePeriodTypeEnum?.id != null
        ? String(template.minimumActivePeriodTypeEnum.id)
        : ''),
    lockinPeriodFrequency:
      current.lockinPeriodFrequency ||
      (template.lockinPeriod != null ? String(template.lockinPeriod) : ''),
    lockinPeriodFrequencyType:
      current.lockinPeriodFrequencyType ||
      (template.lockPeriodTypeEnum?.id != null ? String(template.lockPeriodTypeEnum.id) : ''),
    allowDividendCalculationForInactiveClients:
      template.allowDividendCalculationForInactiveClients === true,
    charges: productCharges.length ? productCharges : current.charges
  };
}

export function CreateShareAccountSheet({
  clientId,
  initialTemplate,
  open,
  onOpenChange,
  onCreated
}: {
  clientId: string;
  initialTemplate: FineractShareAccountTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const initialTransactionDate = useInitialTransactionDate();
  const [template, setTemplate] = useState(initialTemplate);
  const [form, setForm] = useState<FormState>(() => emptyForm(initialTransactionDate));
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingTemplate, startLoadTemplate] = useTransition();

  const productSelected = Boolean(form.productId);
  const currencyCode = productSelected ? template.currency?.code : undefined;

  const productOptions = useMemo(
    () => toSelectOptions(template.productOptions),
    [template.productOptions]
  );
  const savingsOptions = useMemo(
    () =>
      (template.clientSavingsAccounts ?? []).map((account) => ({
        value: String(account.id),
        label: [account.accountNo, account.productName].filter(Boolean).join(' · ') || String(account.id)
      })),
    [template.clientSavingsAccounts]
  );
  const frequencyOptions = useMemo(
    () => toSelectOptions(template.lockinPeriodFrequencyTypeOptions),
    [template.lockinPeriodFrequencyTypeOptions]
  );
  const minActiveFrequencyOptions = useMemo(
    () =>
      toSelectOptions(
        template.minimumActivePeriodFrequencyTypeOptions ??
          template.lockinPeriodFrequencyTypeOptions
      ),
    [template.minimumActivePeriodFrequencyTypeOptions, template.lockinPeriodFrequencyTypeOptions]
  );
  const chargeOptions = useMemo(
    () =>
      (template.chargeOptions ?? []).map((charge) => ({
        value: String(charge.id),
        label: charge.name ?? String(charge.id)
      })),
    [template.chargeOptions]
  );

  const loadTemplate = useCallback(
    (productId: string) => {
      startLoadTemplate(async () => {
        const result = await fetchShareAccountTemplateAction(clientId, productId || undefined);
        if (!isShareAccountTemplate(result)) {
          return;
        }
        setTemplate(result);
        setForm((current) => ({
          ...current,
          ...applyTemplateDefaults(result, current)
        }));
      });
    },
    [clientId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setTemplate(initialTemplate);
    setForm(emptyForm(initialTransactionDate));
    setActiveTab('basic');
    setFieldErrors({});
    setSubmitError(null);
    startTransition(async () => {
      const result = await fetchShareAccountTemplateAction(clientId);
      if (isShareAccountTemplate(result)) {
        setTemplate(result);
      }
    });
  }, [open, initialTemplate, clientId, initialTransactionDate]);

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleProductChange(value: string) {
    patchForm({
      productId: value,
      savingsAccountId: '',
      requestedShares: '',
      minimumActivePeriod: '',
      minimumActivePeriodFrequencyType: '',
      lockinPeriodFrequency: '',
      lockinPeriodFrequencyType: '',
      allowDividendCalculationForInactiveClients: false,
      charges: []
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
      const payload = {
        productId: form.productId,
        submittedDate: form.submittedDate,
        externalId: form.externalId,
        requestedShares: form.requestedShares,
        savingsAccountId: form.savingsAccountId,
        applicationDate: form.applicationDate,
        minimumActivePeriod: form.minimumActivePeriod,
        minimumActivePeriodFrequencyType: form.minimumActivePeriodFrequencyType,
        lockinPeriodFrequency: form.lockinPeriodFrequency,
        lockinPeriodFrequencyType: form.lockinPeriodFrequencyType,
        allowDividendCalculationForInactiveClients:
          form.allowDividendCalculationForInactiveClients,
        charges: form.charges
          .filter((row) => row.chargeId && row.amount)
          .map((row) => ({
            chargeId: row.chargeId,
            amount: row.amount
          }))
      };

      const result = await createShareAccountAction(clientId, payload);
      if (!toastCommandOutcome(result, SHARE_ACCOUNT_CREATE_TOAST)) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      onOpenChange(false);
      onCreated?.();
      if (result.resourceId != null) {
        router.push(clientAccountGeneralPath(clientId, 'share', result.resourceId));
        return;
      }
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New share account"
      description="Apply for a share account for this customer."
      formId={CREATE_SHARE_ACCOUNT_FORM_ID}
      submitLoading={pending || loadingTemplate}
      submitDisabled={productOptions.length === 0}
      submitLabel="Submit application"
      className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={CREATE_SHARE_ACCOUNT_FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')}
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="basic" className="flex-1">
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">
              Advanced
            </TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="mt-0 space-y-4">
            <SelectField
              label="Share product"
              value={form.productId}
              onValueChange={(value) => handleProductChange(value ?? '')}
              options={productOptions}
              placeholder="Select a product"
              error={fieldErrors.productId}
              required
            />
            {currencyCode ? (
              <p className="text-sm text-muted-foreground">
                Currency {currencyCode}
                {template.currentMarketPrice != null ? (
                  <>
                    {' '}
                    · Market price{' '}
                    <MoneyValue amount={template.currentMarketPrice} currencyCode={currencyCode} />
                  </>
                ) : null}
              </p>
            ) : null}
            <TransactionDateField
              label="Submitted on"
              value={form.submittedDate}
              onChange={(value) => patchForm({ submittedDate: value })}
              error={fieldErrors.submittedDate}
              required
            />
            <NumericField
              label="Requested shares"
              value={form.requestedShares}
              onChange={(value) => patchForm({ requestedShares: value })}
              error={fieldErrors.requestedShares}
              required
              disabled={!productSelected}
            />
            <SelectField
              label="Linked savings account"
              value={form.savingsAccountId}
              onValueChange={(value) => patchForm({ savingsAccountId: value ?? '' })}
              options={savingsOptions}
              placeholder={productSelected ? 'Select a savings account' : 'Select a product first'}
              error={fieldErrors.savingsAccountId}
              required
              disabled={!productSelected}
            />
            <TransactionDateField
              label="Application date"
              value={form.applicationDate}
              onChange={(value) => patchForm({ applicationDate: value })}
              error={fieldErrors.applicationDate}
              required
            />
          </TabsContent>
          <TabsContent value="advanced" className="mt-0 space-y-4">
            <TextField
              label="External ID"
              value={form.externalId}
              onChange={(value) => patchForm({ externalId: value })}
              error={fieldErrors.externalId}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumericField
                label="Minimum active period"
                value={form.minimumActivePeriod}
                onChange={(value) => patchForm({ minimumActivePeriod: value })}
                error={fieldErrors.minimumActivePeriod}
              />
              <SelectField
                label="Minimum active period type"
                value={form.minimumActivePeriodFrequencyType}
                onValueChange={(value) =>
                  patchForm({ minimumActivePeriodFrequencyType: value ?? '' })
                }
                options={minActiveFrequencyOptions}
                placeholder="Select type"
                error={fieldErrors.minimumActivePeriodFrequencyType}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumericField
                label="Lock-in period"
                value={form.lockinPeriodFrequency}
                onChange={(value) => patchForm({ lockinPeriodFrequency: value })}
                error={fieldErrors.lockinPeriodFrequency}
              />
              <SelectField
                label="Lock-in period type"
                value={form.lockinPeriodFrequencyType}
                onValueChange={(value) => patchForm({ lockinPeriodFrequencyType: value ?? '' })}
                options={frequencyOptions}
                placeholder="Select type"
                error={fieldErrors.lockinPeriodFrequencyType}
              />
            </div>
            <SwitchField
              label="Allow dividends for inactive clients"
              checked={form.allowDividendCalculationForInactiveClients}
              onCheckedChange={(checked) =>
                patchForm({ allowDividendCalculationForInactiveClients: checked })
              }
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Charges</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!chargeOptions.length}
                  onClick={() =>
                    patchForm({
                      charges: [
                        ...form.charges,
                        { chargeId: '', amount: '', name: undefined }
                      ]
                    })
                  }
                >
                  Add charge
                </Button>
              </div>
              {form.charges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No charges added.</p>
              ) : (
                form.charges.map((row, index) => (
                  <div key={`charge-${index}`} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
                    <SelectField
                      label="Charge"
                      value={row.chargeId}
                      onValueChange={(value) => {
                        const chargeId = value ?? '';
                        const option = template.chargeOptions?.find(
                          (item) => String(item.id) === chargeId
                        );
                        const next = [...form.charges];
                        next[index] = {
                          chargeId,
                          amount:
                            row.amount ||
                            String(option?.amount ?? option?.amountOrPercentage ?? ''),
                          name: option?.name
                        };
                        patchForm({ charges: next });
                      }}
                      options={chargeOptions}
                      placeholder="Select charge"
                    />
                    <NumericField
                      label="Amount"
                      value={row.amount}
                      onChange={(value) => {
                        const next = [...form.charges];
                        next[index] = { ...row, amount: value };
                        patchForm({ charges: next });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="self-end"
                      onClick={() =>
                        patchForm({
                          charges: form.charges.filter((_, i) => i !== index)
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </FormSheet>
  );
}
