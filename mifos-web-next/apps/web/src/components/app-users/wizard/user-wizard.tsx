'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useSession } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { createUserAction, fetchStaffByOfficeAction, updateUserAction } from '@/actions/app-users';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import { formatUserDisplayName } from '@/lib/fineract/user-display';
import { wizardDraftsEqual, wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
import { sanitizeUserSessionDraft } from './session-draft';
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
const USER_WIZARD_SESSION_VERSION = 1;

export function UserWizard({
  mode,
  template,
  initialDraft,
  userId,
  smtpConfigured = true
}: UserWizardProps) {
  const router = useRouter();
  const { user } = useSession();
  const wizardSteps = mode === 'create' ? CREATE_WIZARD_STEPS : EDIT_WIZARD_STEPS;
  const [draft, setDraft] = useState<UserWizardDraft>(initialDraft);
  const [stepId, setStepId] = useState('account');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [staffOptions, setStaffOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffLoadError, setStaffLoadError] = useState<string | null>(null);
  const [staffRetryToken, setStaffRetryToken] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const currentIndex = wizardSteps.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';
  const emailOptions = useMemo(() => ({ smtpConfigured }), [smtpConfigured]);
  const emptySessionDraft = useMemo(
    () => sanitizeUserSessionDraft(initialDraft),
    [initialDraft]
  );
  const isSessionDraftDirty = useCallback(
    (value: UserWizardDraft) => !wizardDraftsEqual(value, emptySessionDraft),
    [emptySessionDraft]
  );
  const sessionDirty = useMemo(
    () => !wizardDraftsEqual(sanitizeUserSessionDraft(draft), emptySessionDraft),
    [draft, emptySessionDraft]
  );
  const leaveDirty = sessionDirty || Boolean(draft.password || draft.repeatPassword);
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: 'app-user',
    entityKey: mode === 'edit' && userId != null ? String(userId) : 'new',
    schemaVersion: USER_WIZARD_SESSION_VERSION,
    draft,
    stepId,
    sanitize: sanitizeUserSessionDraft,
    isDirty: isSessionDraftDirty
  });
  useUnsavedWizardLeave(leaveDirty);
  const staffLookupBlocked = stepId === 'access' && Boolean(staffLoadError);

  useEffect(() => {
    if (!wizardSteps.some((step) => step.id === stepId)) {
      setStepId(wizardSteps[0]?.id ?? 'account');
    }
  }, [wizardSteps, stepId]);

  useEffect(() => {
    if (!draft.officeId) {
      setStaffOptions([]);
      setStaffLoadError(null);
      setStaffLoading(false);
      return;
    }

    let cancelled = false;
    setStaffLoading(true);
    setStaffLoadError(null);
    void (async () => {
      const result = await fetchStaffByOfficeAction(Number(draft.officeId));
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setStaffOptions([]);
        setStaffLoadError(result.message.trim() || 'Could not load staff for this branch.');
        setStaffLoading(false);
        return;
      }
      setStaffOptions(result.data);
      setStaffLoadError(null);
      setStaffLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [draft.officeId, staffRetryToken]);

  const staffLabel = useMemo(() => {
    if (!draft.staffId) {
      return undefined;
    }
    return staffOptions.find((item) => String(item.id) === draft.staffId)?.name;
  }, [draft.staffId, staffOptions]);

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
      return Object.keys(validateUserStep(id, mode, draft, emailOptions)).length > 0;
    });
  }, [validationAttemptedStepIds, mode, draft, emailOptions]);

  const stepErrors = useMemo((): StepErrors => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateUserStep(stepId, mode, draft, emailOptions);
  }, [validationAttemptedStepIds, stepId, mode, draft, isReview, emailOptions]);

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
    if (staffLookupBlocked) {
      return;
    }
    const errors = validateUserStep(stepId, mode, draft, emailOptions);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isReview, staffLookupBlocked, stepId, mode, draft, emailOptions, goNext, markValidationAttempted]);

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
        if (stepToValidate === 'access' && staffLoadError) {
          setStepId(stepToValidate);
          return;
        }
        const errors = validateUserStep(stepToValidate, mode, draft, emailOptions);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [wizardSteps, currentIndex, mode, draft, emailOptions, markValidationAttempted, staffLoadError]
  );

  function handleSubmit() {
    setSubmitError(null);
    const errors = validateUserDraft(mode, draft, emailOptions);
    if (Object.keys(errors).length > 0) {
      for (const step of wizardSteps) {
        if (
          step.id !== 'review' &&
          Object.keys(validateUserStep(step.id, mode, draft, emailOptions)).length
        ) {
          markValidationAttempted(step.id);
        }
      }
      setStepId('review');
      setSubmitError(
        formatActionErrorMessage('Please fix the highlighted fields before creating this user.', errors)
      );
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createUserAction(draftToCreatePayload(draft, emailOptions))
          : await updateUserAction(userId!, draftToUpdatePayload(draft));

      if (!result.ok) {
        setSubmitError(
          wizardSubmitRecoveryMessage(formatActionErrorMessage(result.message, result.fieldErrors))
        );
        return;
      }
      sessionDraft.clear();
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

  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    setDraft({
      ...snapshot.draft,
      password: '',
      repeatPassword: ''
    });
    setStepId(snapshot.stepId);
  }

  function handleCancel() {
    if (leaveDirty) {
      setLeaveOpen(true);
      return;
    }
    router.push(cancelHref);
  }

  const stepProps = { mode, template, draft, errors: stepErrors, smtpConfigured };

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={wizardSteps}
        currentStepId={stepId}
        title={title}
        description={description}
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        banner={
          <>
            {sessionDraft.pendingSnapshot ? (
              <WizardDraftRestoreBanner
                hint="Passwords are not kept in this browser tab."
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
              isReview ? (mode === 'create' ? 'Create user' : 'Save changes') : 'Next'
            }
            onPrimary={isReview ? handleSubmit : tryNext}
            primaryDisabled={pending || staffLookupBlocked}
            primaryLoading={isReview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {stepId === 'account' ? (
          <AccountStep {...stepProps} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : null}

        {stepId === 'access' ? (
          <AccessStep
            {...stepProps}
            staffOptions={staffOptions}
            staffLoading={staffLoading}
            staffLoadError={staffLoadError}
            onRetryStaff={() => setStaffRetryToken((current) => current + 1)}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {stepId === 'password' && mode === 'create' ? (
          <PasswordStep {...stepProps} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
        ) : null}

        {stepId === 'review' ? (
          <ReviewStep
            {...stepProps}
            staffLabel={staffLabel ?? (draft.staffId ? `Staff #${draft.staffId}` : undefined)}
          />
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
