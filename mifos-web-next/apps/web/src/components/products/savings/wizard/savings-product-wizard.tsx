'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertSavingsProductInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useSession } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  createSavingsProductAction,
  fetchSavingsProductChargeOptionsAction,
  updateSavingsProductAction
} from '@/actions/savings-product';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { LookupLoadError } from '@/components/composites/lookup-load-error';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import { useProductChargeOptions } from '@/components/products/shared/use-product-charge-options';
import {
  savingsProductDetailPath,
  SAVINGS_PRODUCTS_LIST_PATH
} from '@/lib/fineract/savings-product-paths';
import {
  savingsProductDraftHasUnsavedChanges,
  sanitizeSavingsProductDraftForSubmit
} from '@/lib/fineract/product-wizard-draft-compare';
import { pruneProductChargeAmounts } from '@/lib/fineract/product-charge-links';
import { pruneProductChargeIds } from '@/lib/fineract/product-charge-options';
import { isProductShortNameLocked } from '@/lib/fineract/product-short-name';
import { wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
import { AccountingStep } from './steps/accounting-step';
import { ChargesStep } from './steps/charges-step';
import { CurrencyStep } from './steps/currency-step';
import { DetailsStep } from './steps/details-step';
import { MappingsStep } from './steps/mappings-step';
import { PaymentChannelsStep } from './steps/payment-channels-step';
import { PreviewStep } from './steps/preview-step';
import { SettingsStep } from './steps/settings-step';
import { TermsStep } from './steps/terms-step';
import type { SavingsProductWizardProps, StepErrors } from './types';
import { validateSavingsProductStep } from './validation';

const SAVINGS_CHARGE_OPTION_STEPS = ['charges', 'channels', 'accounting', 'mappings'] as const;
const SAVINGS_PRODUCT_WIZARD_SESSION_VERSION = 2;

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'currency', label: 'Currency' },
  { id: 'terms', label: 'Terms' },
  { id: 'settings', label: 'Settings' },
  { id: 'charges', label: 'Charges' },
  { id: 'channels', label: 'Channels' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'mappings', label: 'Mappings' },
  { id: 'preview', label: 'Preview' }
];

export function SavingsProductWizard({
  mode,
  template: initialTemplate,
  initialDraft,
  productId
}: SavingsProductWizardProps) {
  const router = useRouter();
  const { user } = useSession();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<UpsertSavingsProductInput>(initialDraft);
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const chargeOptions = useProductChargeOptions({
    currencyCode: draft.currency.currencyCode,
    stepId,
    stepsWithChargeOptions: SAVINGS_CHARGE_OPTION_STEPS,
    fetchOptions: fetchSavingsProductChargeOptionsAction,
    setTemplate,
    setDraft
  });
  const chargeLookupBlocked =
    (Boolean(chargeOptions.loadError) || chargeOptions.loading) &&
    (SAVINGS_CHARGE_OPTION_STEPS as readonly string[]).includes(stepId);

  const lockedShortName = useMemo(() => {
    if (mode !== 'edit') {
      return undefined;
    }
    const name = initialDraft.details.shortName?.trim();
    return isProductShortNameLocked(name) ? name : undefined;
  }, [mode, initialDraft.details.shortName]);

  const hasUnsavedChanges = useMemo(
    () => savingsProductDraftHasUnsavedChanges(draft, initialDraft, lockedShortName),
    [draft, initialDraft, lockedShortName]
  );

  const isSessionDraftDirty = useCallback(
    (value: UpsertSavingsProductInput) =>
      savingsProductDraftHasUnsavedChanges(value, initialDraft, lockedShortName),
    [initialDraft, lockedShortName]
  );
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: 'savings-product',
    entityKey: mode === 'edit' && productId ? productId : 'new',
    schemaVersion: SAVINGS_PRODUCT_WIZARD_SESSION_VERSION,
    draft,
    stepId,
    isDirty: isSessionDraftDirty
  });
  useUnsavedWizardLeave(hasUnsavedChanges);

  useEffect(() => {
    if (!Array.isArray(template.chargeOptions)) {
      return;
    }
    setDraft((current) => {
      let changed = false;
      const channels = (current.paymentChannels.channels ?? []).map((row) => {
        const chargeIds = pruneProductChargeIds(row.chargeIds ?? [], template.chargeOptions, []);
        const chargeAmounts = pruneProductChargeAmounts(chargeIds, row.chargeAmounts);
        const sameIds = chargeIds.length === (row.chargeIds ?? []).length;
        const sameAmounts =
          Object.keys(chargeAmounts).length === Object.keys(row.chargeAmounts ?? {}).length;
        if (sameIds && sameAmounts) {
          return row;
        }
        changed = true;
        return { ...row, chargeIds, chargeAmounts };
      });
      if (!changed) {
        return current;
      }
      return { ...current, paymentChannels: { channels } };
    });
  }, [template.chargeOptions]);

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
      return Object.keys(validateSavingsProductStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateSavingsProductStep(stepId, draft);
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
    if (chargeLookupBlocked) {
      return;
    }
    const errors = validateSavingsProductStep(stepId, draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isPreview, chargeLookupBlocked, stepId, draft, goNext, markValidationAttempted]);

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
        if (
          chargeOptions.loadError &&
          (SAVINGS_CHARGE_OPTION_STEPS as readonly string[]).includes(stepToValidate)
        ) {
          setStepId(stepToValidate);
          return;
        }
        const errors = validateSavingsProductStep(stepToValidate, draft);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [currentIndex, draft, markValidationAttempted, chargeOptions.loadError]
  );

  function handleSubmit() {
    if (mode === 'edit' && !hasUnsavedChanges) {
      return;
    }

    setSubmitError(null);
    const payload = sanitizeSavingsProductDraftForSubmit(draft, lockedShortName);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSavingsProductAction(payload)
          : await updateSavingsProductAction(productId ?? '', payload);

      if (!result.ok) {
        setSubmitError(
          wizardSubmitRecoveryMessage(formatActionErrorMessage(result.message, result.fieldErrors))
        );
        return;
      }

      sessionDraft.clear();
      const id = result.resourceId ?? productId;
      router.push(id ? savingsProductDetailPath(id) : SAVINGS_PRODUCTS_LIST_PATH);
      router.refresh();
    });
  }

  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    setDraft(snapshot.draft);
    setStepId(snapshot.stepId);
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      setLeaveOpen(true);
      return;
    }
    router.push(SAVINGS_PRODUCTS_LIST_PATH);
  }

  const title = mode === 'create' ? 'Create deposit product' : 'Edit deposit product';
  const description =
    mode === 'create'
      ? 'Complete each step to define a new deposit product.'
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
        banner={
          <>
            {sessionDraft.pendingSnapshot ? (
              <WizardDraftRestoreBanner
                onResume={handleResumeDraft}
                onDiscard={sessionDraft.discard}
              />
            ) : null}
            {submitError ? (
              <FineractErrorAlert message={submitError} onRetry={handleSubmit} />
            ) : null}
          </>
        }
        footer={
          <FormWizardFooter
            cancelHref={SAVINGS_PRODUCTS_LIST_PATH}
            onCancel={handleCancel}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={
              isPreview ? (mode === 'create' ? 'Create product' : 'Save changes') : 'Next'
            }
            onPrimary={isPreview ? handleSubmit : tryNext}
            primaryDisabled={
              pending ||
              chargeLookupBlocked ||
              (isPreview && mode === 'edit' && !hasUnsavedChanges)
            }
            primaryLoading={isPreview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {chargeOptions.loadError &&
        (SAVINGS_CHARGE_OPTION_STEPS as readonly string[]).includes(stepId) ? (
          <div className="mb-4">
            <LookupLoadError message={chargeOptions.loadError} onRetry={chargeOptions.retry} />
          </div>
        ) : null}
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

        {stepId === 'channels' ? (
          <PaymentChannelsStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => ({
                ...current,
                paymentChannels: { ...current.paymentChannels, ...patch }
              }))
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
            template={template}
            draft={draft}
            errors={{}}
            mode={mode}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        ) : null}
      </FormWizard>
      <WizardLeaveConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onConfirmLeave={() => {
          setLeaveOpen(false);
          router.push(SAVINGS_PRODUCTS_LIST_PATH);
        }}
      />
    </PlatformRouteLayout>
  );
}
