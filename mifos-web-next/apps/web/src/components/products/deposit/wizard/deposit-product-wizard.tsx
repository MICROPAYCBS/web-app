'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertDepositProductInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  createDepositProductAction,
  fetchDepositProductChargeOptionsAction,
  updateDepositProductAction
} from '@/actions/deposit-product';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useProductChargeOptions } from '@/components/products/shared/use-product-charge-options';
import { depositProductDetailPath } from '@/lib/fineract/deposit-product-config';
import {
  isProductShortNameLocked,
  preserveEstablishedProductShortName
} from '@/lib/fineract/product-short-name';
import { AccountingStep } from './steps/accounting-step';
import { ChargesStep } from './steps/charges-step';
import { CurrencyStep } from './steps/currency-step';
import { DetailsStep } from './steps/details-step';
import { InterestRateChartStep } from './steps/interest-rate-chart-step';
import { PreviewStep } from './steps/preview-step';
import { SettingsStep } from './steps/settings-step';
import { TermsStep } from './steps/terms-step';
import type { DepositProductWizardProps, StepErrors } from './types';
import { validateDepositProductStep } from './validation';

const DEPOSIT_CHARGE_OPTION_STEPS = ['charges', 'accounting'] as const;

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'currency', label: 'Currency' },
  { id: 'terms', label: 'Terms' },
  { id: 'settings', label: 'Settings' },
  { id: 'interestRateChart', label: 'Interest rate chart' },
  { id: 'charges', label: 'Charges' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'preview', label: 'Preview' }
];

function sanitizeDraftForSubmit(
  draft: UpsertDepositProductInput,
  lockedShortName?: string
): UpsertDepositProductInput {
  const accounting = draft.accounting;
  const filterMappings = <T extends Record<string, number>>(
    rows: T[] | undefined,
    keys: [keyof T, keyof T]
  ) => (rows ?? []).filter((row) => row[keys[0]] > 0 && row[keys[1]] > 0);

  return preserveEstablishedProductShortName(
    {
      ...draft,
      accounting: {
        ...accounting,
        paymentChannelToFundSourceMappings: filterMappings(
          accounting.paymentChannelToFundSourceMappings,
          ['paymentTypeId', 'fundSourceAccountId']
        ),
        feeToIncomeAccountMappings: filterMappings(accounting.feeToIncomeAccountMappings, [
          'chargeId',
          'incomeAccountId'
        ]),
        penaltyToIncomeAccountMappings: filterMappings(
          accounting.penaltyToIncomeAccountMappings,
          ['chargeId', 'incomeAccountId']
        )
      }
    },
    lockedShortName
  );
}

export function DepositProductWizard({
  kind,
  config,
  mode,
  template: initialTemplate,
  initialDraft,
  productId
}: DepositProductWizardProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<UpsertDepositProductInput>(initialDraft);
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useProductChargeOptions({
    currencyCode: draft.currency.currencyCode,
    stepId,
    stepsWithChargeOptions: DEPOSIT_CHARGE_OPTION_STEPS,
    fetchOptions: (currencyCode) =>
      fetchDepositProductChargeOptionsAction(kind, currencyCode),
    setTemplate,
    setDraft
  });

  const lockedShortName = useMemo(() => {
    if (mode !== 'edit') {
      return undefined;
    }
    const name = initialDraft.details.shortName?.trim();
    return isProductShortNameLocked(name) ? name : undefined;
  }, [mode, initialDraft.details.shortName]);

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isPreview = stepId === 'preview';

  const markValidationAttempted = useCallback((id: string) => {
    setValidationAttemptedStepIds((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const invalidStepIdsForRail = useMemo(() => {
    return [...validationAttemptedStepIds].filter((id) => {
      if (id === 'preview') {
        return false;
      }
      return Object.keys(validateDepositProductStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateDepositProductStep(stepId, draft);
  }, [validationAttemptedStepIds, stepId, draft, isPreview]);

  const goNext = useCallback(() => {
    const next = WIZARD_STEPS[currentIndex + 1];
    if (next) {
      setStepId(next.id);
    }
  }, [currentIndex]);

  const goBack = useCallback(() => {
    const prev = WIZARD_STEPS[currentIndex - 1];
    if (prev) {
      setStepId(prev.id);
    }
  }, [currentIndex]);

  const tryNext = useCallback(() => {
    if (isPreview) {
      return;
    }
    const errors = validateDepositProductStep(stepId, draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isPreview, stepId, draft, goNext, markValidationAttempted]);

  const goToStep = useCallback(
    (targetStepId: string) => {
      const targetIndex = WIZARD_STEPS.findIndex((step) => step.id === targetStepId);
      if (targetIndex < 0 || targetIndex === currentIndex) {
        return;
      }

      if (targetIndex < currentIndex) {
        setStepId(targetStepId);
        return;
      }

      for (let i = currentIndex; i < targetIndex; i++) {
        const stepToValidate = WIZARD_STEPS[i].id;
        const errors = validateDepositProductStep(stepToValidate, draft);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [currentIndex, draft, markValidationAttempted]
  );

  function handleSubmit() {
    setSubmitError(null);
    const payload = sanitizeDraftForSubmit(draft, lockedShortName);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createDepositProductAction(kind, payload)
          : await updateDepositProductAction(kind, productId ?? '', payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      const id = result.resourceId ?? productId;
      router.push(id ? depositProductDetailPath(kind, id) : config.listPath);
      router.refresh();
    });
  }

  const title = mode === 'create' ? config.createPageTitle : config.editPageTitle;
  const description =
    mode === 'create'
      ? `Complete each step to define a new ${config.label.toLowerCase()}.`
      : 'Update the product configuration and save your changes.';

  const stepProps = { config, template, draft, errors: stepErrors, lockedShortName };

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={WIZARD_STEPS}
        currentStepId={stepId}
        title={title}
        description={description}
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        footer={
          <FormWizardFooter
            cancelHref={config.listPath}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={
              isPreview ? (mode === 'create' ? 'Create product' : 'Save changes') : 'Next'
            }
            onPrimary={isPreview ? handleSubmit : tryNext}
            primaryLoading={isPreview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {stepId === 'details' ? (
          <DetailsStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, details: { ...current.details, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'currency' ? (
          <CurrencyStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, currency: { ...current.currency, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'terms' ? (
          <TermsStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, terms: { ...current.terms, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'settings' ? (
          <SettingsStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'interestRateChart' ? (
          <InterestRateChartStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                interestRateChart: { ...current.interestRateChart, ...patch }
              }))
            }
          />
        ) : null}

        {stepId === 'charges' ? (
          <ChargesStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, charges: { ...current.charges, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'accounting' ? (
          <AccountingStep
            {...stepProps}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                accounting: { ...current.accounting, ...patch }
              }))
            }
          />
        ) : null}

        {isPreview ? (
          <PreviewStep {...stepProps} submitError={submitError} />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
