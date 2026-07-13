'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertLoanProductInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  createLoanProductAction,
  fetchLoanProductChargeOptionsAction,
  updateLoanProductAction
} from '@/actions/loan-product';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useProductChargeOptions } from '@/components/products/shared/use-product-charge-options';
import {
  loanProductDetailPath,
  loanProductListPath
} from '@/lib/fineract/loan-product-paths';
import {
  loanProductDraftHasUnsavedChanges,
  sanitizeLoanProductDraftForSubmit
} from '@/lib/fineract/loan-product-draft';
import {
  isProductShortNameLocked
} from '@/lib/fineract/product-short-name';
import { AccountingStep } from './steps/accounting-step';
import { ChargesStep } from './steps/charges-step';
import { CurrencyStep } from './steps/currency-step';
import { DetailsStep } from './steps/details-step';
import { MappingsStep } from './steps/mappings-step';
import { PreviewStep } from './steps/preview-step';
import { SettingsStep } from './steps/settings-step';
import { TermsStep } from './steps/terms-step';
import type { LoanProductWizardProps, StepErrors } from './types';
import { validateLoanProductStep } from './validation';

const LOAN_CHARGE_OPTION_STEPS = ['charges', 'accounting', 'mappings'] as const;

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'currency', label: 'Currency' },
  { id: 'settings', label: 'Settings' },
  { id: 'terms', label: 'Terms' },
  { id: 'charges', label: 'Charges' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'mappings', label: 'Mappings' },
  { id: 'preview', label: 'Preview' }
];

export function LoanProductWizard({
  mode,
  productKind,
  template: initialTemplate,
  initialDraft,
  productId
}: LoanProductWizardProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<UpsertLoanProductInput>(initialDraft);
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useProductChargeOptions({
    currencyCode: draft.currency.currencyCode,
    stepId,
    stepsWithChargeOptions: LOAN_CHARGE_OPTION_STEPS,
    fetchOptions: (currencyCode) =>
      fetchLoanProductChargeOptionsAction(productKind, currencyCode),
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

  const hasUnsavedChanges = useMemo(
    () => loanProductDraftHasUnsavedChanges(draft, initialDraft, lockedShortName),
    [draft, initialDraft, lockedShortName]
  );

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isPreview = stepId === 'preview';
  const cancelHref = loanProductListPath(productKind);

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
      return Object.keys(validateLoanProductStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateLoanProductStep(stepId, draft);
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
    const errors = validateLoanProductStep(stepId, draft);
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
        const errors = validateLoanProductStep(stepToValidate, draft);
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
    if (mode === 'edit' && !hasUnsavedChanges) {
      return;
    }

    setSubmitError(null);
    const payload = sanitizeLoanProductDraftForSubmit(draft, lockedShortName);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createLoanProductAction(productKind, payload)
          : await updateLoanProductAction(productId ?? '', productKind, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      const id = result.resourceId ?? productId;
      router.push(id ? loanProductDetailPath(id, productKind) : cancelHref);
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create loan product' : 'Edit loan product';
  const description =
    mode === 'create'
      ? 'Complete each step to define a new loan product.'
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
            cancelHref={cancelHref}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={isPreview ? (mode === 'create' ? 'Create product' : 'Save changes') : 'Next'}
            onPrimary={isPreview ? handleSubmit : tryNext}
            primaryDisabled={pending || (isPreview && mode === 'edit' && !hasUnsavedChanges)}
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
            lockedShortName={lockedShortName}
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

        {stepId === 'settings' ? (
          <SettingsStep
            productKind={productKind}
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
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

        {stepId === 'mappings' ? (
          <MappingsStep
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
            productKind={productKind}
            template={template}
            draft={draft}
            errors={{}}
            mode={mode}
            hasUnsavedChanges={hasUnsavedChanges}
            submitError={submitError}
          />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
