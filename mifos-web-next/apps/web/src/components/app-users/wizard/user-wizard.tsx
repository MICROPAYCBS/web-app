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
import { createUserAction, fetchStaffByOfficeAction, updateUserAction } from '@/actions/app-users';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { formatUserDisplayName } from '@/lib/fineract/user-display';
import { AccountStep } from './steps/account-step';
import { AccessStep } from './steps/access-step';
import { PasswordStep } from './steps/password-step';
import { ReviewStep } from './steps/review-step';
import type { UserWizardDraft, UserWizardProps, StepErrors } from './types';
import { draftToCreatePayload, draftToUpdatePayload, validateUserDraft, validateUserStep } from './validation';

const CREATE_WIZARD_STEPS: FormWizardStep[] = [
  { id: 'account', label: 'Account' },
  { id: 'access', label: 'Access' },
  { id: 'password', label: 'Sign-in' },
  { id: 'review', label: 'Review' }
];

const EDIT_WIZARD_STEPS: FormWizardStep[] = [
  { id: 'account', label: 'Account' },
  { id: 'access', label: 'Access' },
  { id: 'review', label: 'Review' }
];

export function UserWizard({ mode, template, initialDraft, userId }: UserWizardProps) {
  const router = useRouter();
  const wizardSteps = mode === 'create' ? CREATE_WIZARD_STEPS : EDIT_WIZARD_STEPS;
  const [draft, setDraft] = useState<UserWizardDraft>(initialDraft);
  const [stepId, setStepId] = useState('account');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [staffLabel, setStaffLabel] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = wizardSteps.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

  useEffect(() => {
    if (!wizardSteps.some((step) => step.id === stepId)) {
      setStepId(wizardSteps[0]?.id ?? 'account');
    }
  }, [wizardSteps, stepId]);

  useEffect(() => {
    if (!draft.staffId || !draft.officeId) {
      setStaffLabel(undefined);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchStaffByOfficeAction(Number(draft.officeId));
      if (cancelled || !result.ok) {
        return;
      }
      const match = result.data.find((item) => String(item.id) === draft.staffId);
      setStaffLabel(match?.name);
    })();

    return () => {
      cancelled = true;
    };
  }, [draft.officeId, draft.staffId]);

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
      if (id === 'review') {
        return false;
      }
      return Object.keys(validateUserStep(id, mode, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, mode, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateUserStep(stepId, mode, draft);
  }, [validationAttemptedStepIds, stepId, mode, draft, isReview]);

  const goNext = useCallback(() => {
    const next = wizardSteps[currentIndex + 1];
    if (next) {
      setStepId(next.id);
    }
  }, [wizardSteps, currentIndex]);

  const goBack = useCallback(() => {
    const prev = wizardSteps[currentIndex - 1];
    if (prev) {
      setStepId(prev.id);
    }
  }, [wizardSteps, currentIndex]);

  const tryNext = useCallback(() => {
    if (isReview) {
      return;
    }
    const errors = validateUserStep(stepId, mode, draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isReview, stepId, mode, draft, goNext, markValidationAttempted]);

  const goToStep = useCallback(
    (targetStepId: string) => {
      const targetIndex = wizardSteps.findIndex((step) => step.id === targetStepId);
      if (targetIndex < 0 || targetIndex === currentIndex) {
        return;
      }

      if (targetIndex < currentIndex) {
        setStepId(targetStepId);
        return;
      }

      for (let i = currentIndex; i < targetIndex; i++) {
        const stepToValidate = wizardSteps[i].id;
        const errors = validateUserStep(stepToValidate, mode, draft);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [wizardSteps, currentIndex, mode, draft, markValidationAttempted]
  );

  function handleSubmit() {
    setSubmitError(null);
    const errors = validateUserDraft(mode, draft);
    if (Object.keys(errors).length > 0) {
      for (const step of wizardSteps) {
        if (step.id !== 'review' && Object.keys(validateUserStep(step.id, mode, draft)).length) {
          markValidationAttempted(step.id);
        }
      }
      setStepId('review');
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createUserAction(draftToCreatePayload(draft))
          : await updateUserAction(userId!, draftToUpdatePayload(draft));

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'User created.' : 'User updated.', pending: mode === 'create' ? 'User created. sent for approval.' : 'User updated. sent for approval.' });
      const id = result.resourceId ?? userId;
      router.push(id ? `/appusers/${id}` : '/appusers');
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create user' : `Edit user: ${formatUserDisplayName({
    firstname: draft.firstname,
    lastname: draft.lastname,
    username: draft.username
  })}`;
  const description =
    mode === 'create'
      ? 'Add a new application user in a few guided steps.'
      : 'Update account details, access, and sign-in settings.';

  const cancelHref =
    mode === 'edit' && userId ? `/appusers/${userId}` : '/appusers';

  const stepProps = { mode, template, draft, errors: stepErrors };

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={wizardSteps}
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
              isReview ? (mode === 'create' ? 'Create user' : 'Save changes') : 'Next'
            }
            onPrimary={isReview ? handleSubmit : tryNext}
            primaryLoading={isReview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {stepId === 'account' ? (
          <AccountStep {...stepProps} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : null}

        {stepId === 'access' ? (
          <AccessStep {...stepProps} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : null}

        {stepId === 'password' && mode === 'create' ? (
          <PasswordStep {...stepProps} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : null}

        {stepId === 'review' ? (
          <ReviewStep
            {...stepProps}
            staffLabel={staffLabel ?? (draft.staffId ? `Staff #${draft.staffId}` : undefined)}
            submitError={submitError}
          />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
