'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createChargeAction, updateChargeAction } from '@/actions/charge';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { penaltyDisabled } from '@/lib/fineract/charge-form-logic';
import { chargeDetailPath, chargeListPath } from '@/lib/fineract/charge-paths';
import { AppliesToStep } from './steps/applies-to-step';
import { AmountSettingsStep } from './steps/amount-settings-step';
import { PreviewStep } from './steps/preview-step';
import { TermsStep } from './steps/terms-step';
import type { ChargeWizardDraft, ChargeWizardProps, StepErrors } from './types';
import { draftToPayload, validateChargeDraft, validateChargeStep } from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'appliesTo', label: 'Applies to' },
  { id: 'terms', label: 'Terms' },
  { id: 'amount', label: 'Amount & settings' },
  { id: 'preview', label: 'Review' }
];

export function ChargeWizard({ mode, template, initialDraft, chargeId }: ChargeWizardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ChargeWizardDraft>(initialDraft);
  const [stepId, setStepId] = useState('appliesTo');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isPreview = stepId === 'preview';

  useEffect(() => {
    if (penaltyDisabled(draft.chargeAppliesTo)) {
      setDraft((current) => (current.penalty ? { ...current, penalty: false } : current));
    }
    if (draft.chargeTimeType === 9) {
      setDraft((current) => (current.penalty ? { ...current, penalty: true } : current));
    }
  }, [draft.chargeAppliesTo, draft.chargeTimeType, draft.penalty]);

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
      return Object.keys(validateChargeStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateChargeStep(stepId, draft);
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
    const errors = validateChargeStep(stepId, draft);
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
        const errors = validateChargeStep(stepToValidate, draft);
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
    const errors = validateChargeDraft(draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted('terms');
      markValidationAttempted('amount');
      setStepId('preview');
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    const payload = draftToPayload({
      ...draft,
      taxGroupId:
        mode === 'edit' && template.taxGroup?.id ? template.taxGroup.id : draft.taxGroupId
    });

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createChargeAction(payload)
          : await updateChargeAction(chargeId ?? '', payload);

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Charge created.' : 'Charge updated.', pending: mode === 'create' ? 'Charge created. sent for approval.' : 'Charge updated. sent for approval.' });
      const id = result.resourceId ?? chargeId;
      router.push(id ? chargeDetailPath(id) : chargeListPath());
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create charge' : 'Edit charge';
  const description =
    mode === 'create'
      ? 'Define a fee or penalty for loans, savings, deposits, shares, or customers.'
      : (template.name ?? 'Update charge configuration.');

  const cancelHref =
    mode === 'edit' && chargeId ? chargeDetailPath(chargeId) : chargeListPath();

  const stepProps = { mode, template, draft, errors: stepErrors };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
            primaryLabel={
              isPreview ? (mode === 'create' ? 'Create charge' : 'Save changes') : 'Next'
            }
            onPrimary={isPreview ? handleSubmit : tryNext}
            primaryLoading={isPreview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {stepId === 'appliesTo' ? (
          <AppliesToStep
            {...stepProps}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {stepId === 'terms' ? (
          <TermsStep
            {...stepProps}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {stepId === 'amount' ? (
          <AmountSettingsStep
            {...stepProps}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {isPreview ? (
          <PreviewStep {...stepProps} submitError={submitError} />
        ) : null}
      </FormWizard>
    </div>
  );
}
