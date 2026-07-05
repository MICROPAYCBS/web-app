'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertShareProductInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  createShareProductAction,
  fetchShareProductChargeOptionsAction,
  updateShareProductAction
} from '@/actions/share-product';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useProductChargeOptions } from '@/components/products/shared/use-product-charge-options';
import {
  shareProductDetailPath,
  SHARE_PRODUCTS_LIST_PATH
} from '@/lib/fineract/share-product-paths';
import { AccountingStep } from './steps/accounting-step';
import { ChargesStep } from './steps/charges-step';
import { CurrencyStep } from './steps/currency-step';
import { DetailsStep } from './steps/details-step';
import { MarketPriceStep } from './steps/market-price-step';
import { PreviewStep } from './steps/preview-step';
import { SettingsStep } from './steps/settings-step';
import { TermsStep } from './steps/terms-step';
import type { ShareProductWizardProps, StepErrors } from './types';
import { validateShareProductStep } from './validation';

const SHARE_CHARGE_OPTION_STEPS = ['charges', 'accounting'] as const;

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'currency', label: 'Currency' },
  { id: 'terms', label: 'Terms' },
  { id: 'settings', label: 'Settings' },
  { id: 'marketPrice', label: 'Market price' },
  { id: 'charges', label: 'Charges' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'preview', label: 'Preview' }
];

function sanitizeDraftForSubmit(draft: UpsertShareProductInput): UpsertShareProductInput {
  const marketPricePeriods = (draft.marketPrice.marketPricePeriods ?? []).filter(
    (row) => row.fromDate?.trim() && row.shareValue > 0
  );

  return {
    ...draft,
    marketPrice: { marketPricePeriods }
  };
}

export function ShareProductWizard({
  mode,
  template: initialTemplate,
  initialDraft,
  productId
}: ShareProductWizardProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<UpsertShareProductInput>(initialDraft);
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useProductChargeOptions({
    currencyCode: draft.currency.currencyCode,
    stepId,
    stepsWithChargeOptions: SHARE_CHARGE_OPTION_STEPS,
    fetchOptions: fetchShareProductChargeOptionsAction,
    setTemplate,
    setDraft
  });

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
      return Object.keys(validateShareProductStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateShareProductStep(stepId, draft);
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
    const errors = validateShareProductStep(stepId, draft);
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
        const errors = validateShareProductStep(stepToValidate, draft);
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
    const payload = sanitizeDraftForSubmit(draft);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createShareProductAction(payload)
          : await updateShareProductAction(productId ?? '', payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      const id = result.resourceId ?? productId;
      router.push(id ? shareProductDetailPath(id) : SHARE_PRODUCTS_LIST_PATH);
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create share product' : 'Edit share product';
  const description =
    mode === 'create'
      ? 'Complete each step to define a new share product.'
      : 'Update the product configuration and save your changes.';

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
            cancelHref={SHARE_PRODUCTS_LIST_PATH}
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
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, details: { ...current.details, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'currency' ? (
          <CurrencyStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, currency: { ...current.currency, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'terms' ? (
          <TermsStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, terms: { ...current.terms, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'settings' ? (
          <SettingsStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'marketPrice' ? (
          <MarketPriceStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                marketPrice: { ...current.marketPrice, ...patch }
              }))
            }
          />
        ) : null}

        {stepId === 'charges' ? (
          <ChargesStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, charges: { ...current.charges, ...patch } }))
            }
          />
        ) : null}

        {stepId === 'accounting' ? (
          <AccountingStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                accounting: { ...current.accounting, ...patch }
              }))
            }
          />
        ) : null}

        {isPreview ? (
          <PreviewStep
            template={template}
            draft={draft}
            errors={{}}
            submitError={submitError}
          />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
