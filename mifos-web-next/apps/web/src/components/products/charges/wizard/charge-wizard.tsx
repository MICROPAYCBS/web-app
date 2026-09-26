'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, upsertChargeSchema } from '@mifos/validation';
import { useSession } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { createChargeAction, updateChargeAction } from '@/actions/charge';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import { isChargeTiersAllowed, penaltyLocked } from '@/lib/fineract/charge-form-logic';
import { chargeDetailPath, chargeListPath } from '@/lib/fineract/charge-paths';
import { wizardDraftsEqual, wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
import { AppliesToStep } from './steps/applies-to-step';
import { AmountSettingsStep } from './steps/amount-settings-step';
import { PreviewStep } from './steps/preview-step';
import { TermsStep } from './steps/terms-step';
import type { ChargeWizardDraft, ChargeWizardProps, StepErrors } from './types';
import {
  chargeStepIdForField,
  draftToPayload,
  validateChargeDraft,
  validateChargeStep
} from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'appliesTo', label: 'Applies to' },
  { id: 'terms', label: 'Terms' },
  { id: 'amount', label: 'Amount & settings' },
  { id: 'preview', label: 'Review' }
];
const CHARGE_WIZARD_SESSION_VERSION = 1;

export function ChargeWizard({ mode, template, initialDraft, chargeId }: ChargeWizardProps) {
  const router = useRouter();
  const { user } = useSession();
  const [draft, setDraft] = useState<ChargeWizardDraft>(initialDraft);
  const [stepId, setStepId] = useState('appliesTo');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<StepErrors>({});
  const [pending, startTransition] = useTransition();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isPreview = stepId === 'preview';
  const cancelHref =
    mode === 'edit' && chargeId ? chargeDetailPath(chargeId) : chargeListPath();
  const isSessionDraftDirty = useCallback(
    (value: ChargeWizardDraft) => !wizardDraftsEqual(value, initialDraft),
    [initialDraft]
  );
  const sessionDirty = useMemo(
    () => !wizardDraftsEqual(draft, initialDraft),
    [draft, initialDraft]
  );
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: 'charge',
    entityKey: mode === 'edit' && chargeId ? chargeId : 'new',
    schemaVersion: CHARGE_WIZARD_SESSION_VERSION,
    draft,
    stepId,
    isDirty: isSessionDraftDirty
  });
  useUnsavedWizardLeave(sessionDirty);

  useEffect(() => {
    const lock = penaltyLocked(draft.chargeAppliesTo, draft.chargeTimeType);
    if (lock === 'on' && draft.penalty !== true) {
      setDraft((current) => ({ ...current, penalty: true }));
    } else if (lock === 'off' && draft.penalty) {
      setDraft((current) => ({ ...current, penalty: false }));
    }
  }, [draft.chargeAppliesTo, draft.chargeTimeType, draft.penalty]);

  useEffect(() => {
    if (
      draft.useChargeTiers &&
      !isChargeTiersAllowed(draft.chargeAppliesTo, draft.chargeTimeType)
    ) {
      setDraft((current) => ({
        ...current,
        useChargeTiers: false,
        chargeTiers: []
      }));
    }
  }, [draft.useChargeTiers, draft.chargeAppliesTo, draft.chargeTimeType]);

  useEffect(() => {
    if (draft.useChargeTiers && draft.amount == null) {
      setDraft((current) => ({ ...current, amount: 0 }));
    }
  }, [draft.useChargeTiers, draft.amount]);

  const patchDraft = useCallback((patch: Partial<ChargeWizardDraft>) => {
    setApiFieldErrors({});
    setDraft((current) => {
      const next = { ...current, ...patch };
      // Only allow clearing bands when tiers are being turned off. Accidental
      // `{ chargeTiers: [] }` patches (stale Switch enable) wiped Review/submit.
      const clearingTiers =
        Object.prototype.hasOwnProperty.call(patch, 'chargeTiers') &&
        Array.isArray(patch.chargeTiers) &&
        patch.chargeTiers.length === 0 &&
        (current.chargeTiers?.length ?? 0) > 0;
      if (clearingTiers && patch.useChargeTiers !== false) {
        next.chargeTiers = current.chargeTiers;
      }
      return next;
    });
  }, []);

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
    const fromApi: StepErrors = {};
    for (const [field, message] of Object.entries(apiFieldErrors)) {
      if (chargeStepIdForField(field) === stepId) {
        fromApi[field] = message;
      }
    }
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return fromApi;
    }
    return { ...fromApi, ...validateChargeStep(stepId, draft) };
  }, [apiFieldErrors, validationAttemptedStepIds, stepId, draft, isPreview]);

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

    const prepared = draftToPayload({
      ...draft,
      taxGroupId:
        mode === 'edit' && template.taxGroup?.id ? template.taxGroup.id : draft.taxGroupId
    });
    const parsed = upsertChargeSchema.safeParse(prepared);
    if (!parsed.success) {
      markValidationAttempted('terms');
      markValidationAttempted('amount');
      setStepId('preview');
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    // Pass a JSON string so nested chargeTiers are not dropped by the Server Action Flight serializer.
    const actionPayload = JSON.stringify(parsed.data);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createChargeAction(actionPayload)
          : await updateChargeAction(chargeId ?? '', actionPayload);

      if (!result.ok) {
        const fieldErrors = result.fieldErrors ?? {};
        setApiFieldErrors(fieldErrors);
        const firstField = Object.keys(fieldErrors)[0];
        const errorStep = firstField ? chargeStepIdForField(firstField) : undefined;
        if (errorStep) {
          markValidationAttempted(errorStep);
          setStepId(errorStep);
        }
        setSubmitError(
          wizardSubmitRecoveryMessage(formatActionErrorMessage(result.message, result.fieldErrors))
        );
        return;
      }
      sessionDraft.clear();
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Charge created.' : 'Charge updated.', pending: mode === 'create' ? 'Charge created. sent for approval.' : 'Charge updated. sent for approval.' });
      const id = result.resourceId ?? chargeId;
      router.push(id ? chargeDetailPath(id) : chargeListPath());
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create charge' : 'Edit charge';
  const description =
    mode === 'create'
      ? 'Define a fee or penalty for loans, savings, deposits, or shares.'
      : (template.name ?? 'Update charge configuration.');

  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    setDraft(snapshot.draft);
    setStepId(snapshot.stepId);
  }

  function handleCancel() {
    if (sessionDirty) {
      setLeaveOpen(true);
      return;
    }
    router.push(cancelHref);
  }

  const stepProps = { mode, template, draft, errors: stepErrors };

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
            cancelHref={cancelHref}
            onCancel={handleCancel}
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
          <AppliesToStep {...stepProps} onChange={patchDraft} />
        ) : null}

        {stepId === 'terms' ? (
          <TermsStep {...stepProps} onChange={patchDraft} />
        ) : null}

        {stepId === 'amount' ? (
          <AmountSettingsStep {...stepProps} onChange={patchDraft} />
        ) : null}

        {isPreview ? (
          <PreviewStep {...stepProps} />
        ) : null}
      </FormWizard>
      <WizardLeaveConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onConfirmLeave={() => {
          setLeaveOpen(false);
          router.push(cancelHref);
        }}
      />
    </PlatformRouteLayout>
  );
}
