'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import { formatActionErrorMessage, loanApplicationStepForField } from '@mifos/validation';
import { useSession } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  createClientLoanAccountAction,
  fetchClientLoanAccountTemplateAction,
  updateClientLoanAccountAction
} from '@/actions/client-loan-account';
import { useLoanSchedulePreview } from '@/components/clients/loan-account/use-loan-schedule-preview';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { LookupLoadError } from '@/components/composites/lookup-load-error';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  emptyLoanAccountDraft,
  loanAccountDraftFromTemplate,
  mergeLoanAccountChargesStep,
  mergeLoanAccountCoreStep,
  mergeLoanAccountFinancialStep,
  mergeLoanAccountPayoutStep,
  mergeLoanAccountSecurityStep,
  mergeLoanAccountTimelineStep,
  type LoanAccountDraft
} from '@/lib/fineract/client-loan-account-draft';
import { defaultLoanAccountChargesFromTemplate } from '@/lib/fineract/loan-application-charges';
import { interpretLoanProductTemplateResult } from '@/lib/fineract/loan-product-template-load';
import { wizardDraftsEqual, wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
import { LoanAccountChargesStep } from './steps/charges-step';
import { LoanAccountCoreStep } from './steps/core-step';
import { LoanAccountFinancialStep } from './steps/financial-step';
import { LoanAccountPayoutStep } from './steps/payout-step';
import { LoanAccountPreviewStep } from './steps/preview-step';
import { LoanAccountScheduleStep } from './steps/schedule-step';
import { LoanAccountSecurityStep } from './steps/security-step';
import { LoanAccountTimelineStep } from './steps/timeline-step';
import { validateLoanAccountStep, resolveLoanAccountWizardStepErrors } from './validation';
const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'core', label: 'Product' },
  { id: 'financial', label: 'Terms' },
  { id: 'timeline', label: 'Interest' },
  { id: 'charges', label: 'Charges' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'security', label: 'Security' },
  { id: 'payout', label: 'Payout' },
  { id: 'preview', label: 'Preview' }
];
const SCHEDULE_STEP_INDEX = WIZARD_STEPS.findIndex((step) => step.id === 'schedule');
const CREATE_LOAN_ACCOUNT_WIZARD_ID = 'create-loan-account';
const CREATE_LOAN_ACCOUNT_WIZARD_SESSION_VERSION = 1;
export type LoanAccountWizardMode = 'create' | 'edit';
export function LoanAccountWizard({
  mode = 'create',
  loanId,
  clientId,
  clientDisplayName,
  initialTemplate,
  initialDraft
}: {
  mode?: LoanAccountWizardMode;
  loanId?: string;
  clientId: string;
  clientDisplayName?: string;
  initialTemplate: ClientLoanAccountTemplate;
  initialDraft?: LoanAccountDraft;
}) {
  const isEdit = mode === 'edit';
  const router = useRouter();
  const { user } = useSession();
  const initialTransactionDate = useInitialTransactionDate();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<LoanAccountDraft>(
    () => initialDraft ?? emptyLoanAccountDraft(initialTransactionDate)
  );
  const [stepId, setStepId] = useState('core');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [productTemplateLoading, setProductTemplateLoading] = useState(false);
  const [productTemplateError, setProductTemplateError] = useState<string | null>(null);
  const productTemplateRequestRef = useRef(0);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [scheduleStepError, setScheduleStepError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const schedulePreviewEnabled =
    draft.productId > 0 && currentIndex >= SCHEDULE_STEP_INDEX;
  const schedulePreview = useLoanSchedulePreview({
    clientId,
    draft,
    template,
    enabled: schedulePreviewEnabled
  });
  const isSchedule = stepId === 'schedule';
  const isPreview = stepId === 'preview';
  const isReviewStep = isSchedule || isPreview;
  const cancelHref =
    isEdit && loanId
      ? clientAccountGeneralPath(clientId, 'loan', loanId)
      : `/clients/${clientId}/loans`;
  const emptySessionDraft = useMemo(
    () => emptyLoanAccountDraft(initialTransactionDate),
    [initialTransactionDate]
  );
  const sessionDirty = useMemo(
    () => !wizardDraftsEqual(draft, emptySessionDraft),
    [draft, emptySessionDraft]
  );
  const isSessionDraftDirty = useCallback(
    (value: LoanAccountDraft) => !wizardDraftsEqual(value, emptySessionDraft),
    [emptySessionDraft]
  );
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: CREATE_LOAN_ACCOUNT_WIZARD_ID,
    entityKey: clientId,
    schemaVersion: CREATE_LOAN_ACCOUNT_WIZARD_SESSION_VERSION,
    draft,
    stepId,
    isDirty: isSessionDraftDirty,
    enabled: !isEdit
  });
  useUnsavedWizardLeave(sessionDirty);
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
      if (id === 'preview' || id === 'schedule' || id === 'charges') {
        return false;
      }
      return Object.keys(validateLoanAccountStep(id, draft, template)).length > 0;
    });
  }, [validationAttemptedStepIds, draft, template]);
  const stepErrors = useMemo(() => {
    return resolveLoanAccountWizardStepErrors(stepId, draft, template, {
      validationAttempted: validationAttemptedStepIds.has(stepId),
      isReviewStep,
      serverFieldErrors
    });
  }, [
    validationAttemptedStepIds,
    stepId,
    draft,
    template,
    isReviewStep,
    isPreview,
    isSchedule,
    serverFieldErrors
  ]);
  const applyProductTemplate = useCallback(
    (productId: number, result: ClientLoanAccountTemplate) => {
      const seededDraft = loanAccountDraftFromTemplate(result, initialTransactionDate);
      setTemplate(result);
      setDraft((current) => ({
        ...current,
        ...seededDraft,
        productId,
        loanOfficerId: current.loanOfficerId,
        loanPurposeId: current.loanPurposeId,
        fundId: current.fundId,
        externalId: current.externalId,
        submittedOnDate: current.submittedOnDate,
        expectedDisbursementDate: current.expectedDisbursementDate,
        linkAccountId: current.linkAccountId,
        charges: seededDraft.charges,
        collateral: current.collateral,
        guarantors: current.guarantors,
        enableDownPayment:
          result.enableDownPayment === true
            ? (seededDraft.enableDownPayment ?? true)
            : undefined
      }));
    },
    [clientId, initialTransactionDate]
  );
  const loadProductTemplate = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!productId) {
        return false;
      }
      const requestId = ++productTemplateRequestRef.current;
      setProductTemplateLoading(true);
      setProductTemplateError(null);
      try {
        const result = await fetchClientLoanAccountTemplateAction(clientId, String(productId));
        if (requestId !== productTemplateRequestRef.current) {
          return false;
        }
        const interpreted = interpretLoanProductTemplateResult(result);
        if (!interpreted.ok) {
          setProductTemplateError(interpreted.message);
          return false;
        }
        applyProductTemplate(productId, interpreted.template);
        return true;
      } finally {
        if (requestId === productTemplateRequestRef.current) {
          setProductTemplateLoading(false);
        }
      }
    },
    [applyProductTemplate, clientId]
  );
  useEffect(() => {
    if (
      draft.productId > 0 &&
      template.product?.id === draft.productId &&
      (draft.charges?.length ?? 0) === 0 &&
      (template.charges?.length ?? 0) > 0
    ) {
      setDraft((current) => ({
        ...current,
        charges: defaultLoanAccountChargesFromTemplate(template.charges)
      }));
    }
  }, [draft.charges?.length, draft.productId, template]);
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
        const errors = validateLoanAccountStep(stepToValidate, draft, template);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }
      setStepId(targetStepId);
    },
    [currentIndex, draft, template, markValidationAttempted]
  );
  const tryNext = useCallback(async () => {
    markValidationAttempted(stepId);
    const errors = validateLoanAccountStep(stepId, draft, template);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (stepId === 'schedule') {
      if (schedulePreview.loading) {
        setScheduleStepError('Repayment schedule is still calculating. Please wait.');
        return;
      }
      if (!schedulePreview.canPreview) {
        setScheduleStepError('Complete loan terms on earlier steps to calculate the repayment schedule.');
        return;
      }
      if (!schedulePreview.hasSuccessfulPreview || schedulePreview.stale) {
        setScheduleStepError('Recalculate the repayment schedule before continuing.');
        return;
      }
      setScheduleStepError(null);
    }
    if (stepId === 'core' && productTemplateError) {
      return;
    }
    if (stepId === 'core' && draft.productId > 0 && !isEdit) {
      const loaded = await loadProductTemplate(draft.productId);
      if (!loaded) {
        return;
      }
    }
    goNext();
  }, [
    markValidationAttempted,
    stepId,
    draft,
    template,
    loadProductTemplate,
    goNext,
    schedulePreview,
    isEdit,
    productTemplateError
  ]);
  const handleSubmit = useCallback(() => {
    markValidationAttempted('preview');
    const errors = validateLoanAccountStep('preview', draft, template, serverFieldErrors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (schedulePreview.loading) {
      setSubmitError('Repayment schedule is still calculating. Please wait.');
      return;
    }
    if (!schedulePreview.hasSuccessfulPreview || schedulePreview.stale) {
      setSubmitError('Recalculate the repayment schedule before submitting.');
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result =
        isEdit && loanId
          ? await updateClientLoanAccountAction(
              clientId,
              loanId,
              draft,
              schedulePreview.productContext
            )
          : await createClientLoanAccountAction(
              clientId,
              draft,
              schedulePreview.productContext
            );
      if (!toastCommandOutcome(result, {
        completed: isEdit ? 'Loan application updated.' : 'Loan application submitted.',
        pending: isEdit
          ? 'Loan application update sent for approval.'
          : 'Loan application sent for approval.'
      })) {
        setSubmitError(
          wizardSubmitRecoveryMessage(
            formatActionErrorMessage(result.message, result.fieldErrors)
          )
        );
        if (result.fieldErrors) {
          setServerFieldErrors(result.fieldErrors);
          const firstField = Object.keys(result.fieldErrors)[0];
          const targetStep = firstField
            ? loanApplicationStepForField(firstField)
            : undefined;
          if (targetStep) {
            setStepId(targetStep);
            markValidationAttempted(targetStep);
          }
        }
        return;
      }
      if (!isEdit) {
        sessionDraft.clear();
      }
      if (result.resourceId) {
        router.push(clientAccountGeneralPath(clientId, 'loan', result.resourceId));
      } else if (isEdit && loanId) {
        router.push(clientAccountGeneralPath(clientId, 'loan', loanId));
      } else {
        router.push(cancelHref);
      }
      router.refresh();
    });
  }, [
    markValidationAttempted,
    draft,
    template,
    clientId,
    router,
    cancelHref,
    schedulePreview,
    serverFieldErrors,
    isEdit,
    loanId,
    sessionDraft
  ]);
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

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={WIZARD_STEPS}
        currentStepId={stepId}
        title={isEdit ? 'Modify application' : 'Apply for loan'}
        description={
          isEdit
            ? clientDisplayName
              ? `Update this pending loan application for ${clientDisplayName}.`
              : 'Update this pending loan application.'
            : clientDisplayName
              ? `Complete each step to submit a loan application for ${clientDisplayName}.`
              : 'Complete each step to submit a loan application for this customer.'
        }
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        banner={
          <>
            {!isEdit && sessionDraft.pendingSnapshot ? (
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
            primaryLabel={isPreview ? (isEdit ? 'Save changes' : 'Submit application') : 'Next'}
            onPrimary={isPreview ? handleSubmit : tryNext}
            primaryLoading={isPreview && pending}
            primaryLoadingLabel={isEdit ? 'Saving…' : 'Submitting…'}
            primaryDisabled={
              pending ||
              productTemplateLoading ||
              Boolean(productTemplateError) ||
              (isSchedule &&
                (schedulePreview.loading ||
                  !schedulePreview.hasSuccessfulPreview ||
                  schedulePreview.stale)) ||
              (isPreview &&
                (schedulePreview.loading ||
                  !schedulePreview.hasSuccessfulPreview ||
                  schedulePreview.stale))
            }
          />
        }
      >
        {stepId === 'core' ? (
          <>
            {productTemplateError ? (
              <div className="mb-4">
                <LookupLoadError
                  message={productTemplateError}
                  onRetry={() => {
                    if (draft.productId > 0) {
                      void loadProductTemplate(draft.productId);
                    }
                  }}
                />
              </div>
            ) : null}
            <LoanAccountCoreStep
              template={template}
              draft={draft}
              errors={stepErrors}
              productLocked={isEdit}
              productTemplateLoading={productTemplateLoading}
              onChange={(patch) => {
                setDraft((current) => mergeLoanAccountCoreStep(current, patch));
                if (patch.productId && patch.productId !== draft.productId) {
                  void loadProductTemplate(patch.productId);
                }
              }}
            />
          </>
        ) : null}
        {stepId === 'financial' ? (
          <LoanAccountFinancialStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => mergeLoanAccountFinancialStep(current, patch))
            }
          />
        ) : null}
        {stepId === 'timeline' ? (
          <LoanAccountTimelineStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => mergeLoanAccountTimelineStep(current, patch))
            }
          />
        ) : null}
        {stepId === 'security' ? (
          <LoanAccountSecurityStep
            template={template}
            draft={draft}
            errors={stepErrors}
            principal={draft.principal}
            onChange={(patch) =>
              setDraft((current) => mergeLoanAccountSecurityStep(current, patch))
            }
          />
        ) : null}
        {stepId === 'payout' ? (
          <LoanAccountPayoutStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) => {
              setDraft((current) => mergeLoanAccountPayoutStep(current, patch));
              setServerFieldErrors((current) => {
                const next = { ...current };
                for (const key of Object.keys(patch)) {
                  delete next[key];
                }
                return next;
              });
            }}
          />
        ) : null}
        {stepId === 'charges' ? (
          <LoanAccountChargesStep
            template={template}
            draft={draft}
            errors={stepErrors}
            onChange={(patch) =>
              setDraft((current) => mergeLoanAccountChargesStep(current, patch))
            }
          />
        ) : null}
        {stepId === 'schedule' ? (
          <LoanAccountScheduleStep
            schedule={schedulePreview.schedule}
            loading={schedulePreview.loading}
            stale={schedulePreview.stale}
            error={schedulePreview.error}
            fieldErrors={schedulePreview.fieldErrors}
            stepError={scheduleStepError}
            canPreview={schedulePreview.canPreview}
            onRecalculate={() => void schedulePreview.recalculate()}
          />
        ) : null}
        {stepId === 'preview' ? (
          <LoanAccountPreviewStep template={template} draft={draft} />
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
export function CreateLoanAccountWizard({
  clientId,
  clientDisplayName,
  initialTemplate,
  initialDraft
}: {
  clientId: string;
  clientDisplayName?: string;
  initialTemplate: ClientLoanAccountTemplate;
  initialDraft?: LoanAccountDraft;
}) {
  return (
    <LoanAccountWizard
      mode="create"
      clientId={clientId}
      clientDisplayName={clientDisplayName}
      initialTemplate={initialTemplate}
      initialDraft={initialDraft}
    />
  );
}
