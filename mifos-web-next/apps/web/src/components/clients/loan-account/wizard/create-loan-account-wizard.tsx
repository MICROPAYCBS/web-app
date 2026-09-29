'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ClientLoanAccountTemplate, LoanOriginatorListItem } from '@mifos/api-client';
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
import { LoanTopupFields } from '@/components/clients/loan-account/loan-topup-fields';
import { useLoanTopup } from '@/components/clients/loan-account/use-loan-topup';
import { loanTopupErrorsForStep } from '@/lib/fineract/loan-topup';
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
const CREATE_LOAN_ACCOUNT_WIZARD_SESSION_VERSION = 3;
const TOPUP_PRODUCT_ERROR = 'This product cannot be used for a top-up';
export type LoanAccountWizardMode = 'create' | 'edit';
export function LoanAccountWizard({
  mode = 'create',
  loanId,
  clientId,
  clientDisplayName,
  initialTemplate,
  initialDraft,
  originatorOptions = []
}: {
  mode?: LoanAccountWizardMode;
  loanId?: string;
  clientId: string;
  clientDisplayName?: string;
  initialTemplate: ClientLoanAccountTemplate;
  initialDraft?: LoanAccountDraft;
  originatorOptions?: LoanOriginatorListItem[];
}) {
  const isEdit = mode === 'edit';
  const lockTopupLoan =
    !isEdit &&
    initialDraft?.isTopup === true &&
    initialDraft.loanIdToClose != null &&
    initialDraft.loanIdToClose > 0;
  const router = useRouter();
  const { user } = useSession();
  const initialTransactionDate = useInitialTransactionDate();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<LoanAccountDraft>(
    () => initialDraft ?? emptyLoanAccountDraft(initialTransactionDate)
  );
  const topup = useLoanTopup({
    clientId,
    excludeLoanId: isEdit && loanId ? Number(loanId) : undefined,
    template,
    draft
  });
  const [stepId, setStepId] = useState('core');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [productTemplateLoading, setProductTemplateLoading] = useState(false);
  const [productTemplateError, setProductTemplateError] = useState<string | null>(null);
  const [topupProductError, setTopupProductError] = useState<string | null>(null);
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
    () =>
      lockTopupLoan && initialDraft
        ? initialDraft
        : emptyLoanAccountDraft(initialTransactionDate),
    [initialDraft, initialTransactionDate, lockTopupLoan]
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
    entityKey: lockTopupLoan
      ? `${clientId}:topup:${initialDraft?.loanIdToClose}`
      : clientId,
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
      return (
        Object.keys({
          ...validateLoanAccountStep(id, draft, template),
          ...loanTopupErrorsForStep(id, topup.fieldErrors)
        }).length > 0
      );
    });
  }, [validationAttemptedStepIds, draft, template, topup.fieldErrors]);
  const stepErrors = useMemo(() => {
    const resolved = resolveLoanAccountWizardStepErrors(stepId, draft, template, {
      validationAttempted: validationAttemptedStepIds.has(stepId),
      isReviewStep,
      serverFieldErrors
    });
    return {
      ...resolved,
      ...loanTopupErrorsForStep(stepId, topup.fieldErrors),
      ...(topupProductError && (stepId === 'core' || stepId === 'preview' || stepId === 'schedule')
        ? { productId: topupProductError }
        : {})
    };
  }, [
    validationAttemptedStepIds,
    stepId,
    draft,
    template,
    isReviewStep,
    isPreview,
    isSchedule,
    serverFieldErrors,
    topup.fieldErrors,
    topupProductError
  ]);
  const applyProductTemplate = useCallback(
    (productId: number, result: ClientLoanAccountTemplate, preserveTopup = false) => {
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
        originators: current.originators,
        enableDownPayment:
          result.enableDownPayment === true
            ? (seededDraft.enableDownPayment ?? true)
            : undefined,
        isTopup: lockTopupLoan
          ? true
          : result.canUseForTopup === true && preserveTopup
            ? current.isTopup === true
            : false,
        loanIdToClose: lockTopupLoan
          ? current.loanIdToClose
          : result.canUseForTopup === true && preserveTopup && current.isTopup === true
            ? current.loanIdToClose
            : undefined
      }));
      setTopupProductError(
        lockTopupLoan && result.canUseForTopup !== true ? TOPUP_PRODUCT_ERROR : null
      );
    },
    [initialTransactionDate, lockTopupLoan]
  );
  const loadProductTemplate = useCallback(
    async (productId: number, preserveTopup = true): Promise<boolean> => {
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
        applyProductTemplate(productId, interpreted.template, preserveTopup);
        if (lockTopupLoan && interpreted.template.canUseForTopup !== true) {
          return false;
        }
        return true;
      } finally {
        if (requestId === productTemplateRequestRef.current) {
          setProductTemplateLoading(false);
        }
      }
    },
    [applyProductTemplate, clientId, lockTopupLoan]
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
        const errors = {
          ...validateLoanAccountStep(stepToValidate, draft, template),
          ...loanTopupErrorsForStep(stepToValidate, topup.fieldErrors),
          ...(topupProductError &&
          (stepToValidate === 'core' || stepToValidate === 'schedule' || stepToValidate === 'preview')
            ? { productId: topupProductError }
            : {})
        };
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }
      setStepId(targetStepId);
    },
    [currentIndex, draft, template, markValidationAttempted, topup.fieldErrors, topupProductError]
  );
  const tryNext = useCallback(async () => {
    markValidationAttempted(stepId);
    const errors = {
      ...validateLoanAccountStep(stepId, draft, template),
      ...loanTopupErrorsForStep(stepId, topup.fieldErrors),
      ...(topupProductError && (stepId === 'core' || stepId === 'schedule' || stepId === 'preview')
        ? { productId: topupProductError }
        : {})
    };
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      const targetStep = firstField ? loanApplicationStepForField(firstField) : undefined;
      if (targetStep && targetStep !== stepId) {
        setStepId(targetStep);
        markValidationAttempted(targetStep);
      }
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
    productTemplateError,
    topup.fieldErrors,
    topupProductError
  ]);
  const handleSubmit = useCallback(() => {
    markValidationAttempted('preview');
    const errors = {
      ...validateLoanAccountStep('preview', draft, template, serverFieldErrors),
      ...loanTopupErrorsForStep('preview', topup.fieldErrors),
      ...(topupProductError ? { productId: topupProductError } : {})
    };
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      const targetStep = firstField ? loanApplicationStepForField(firstField) : undefined;
      if (targetStep) {
        setStepId(targetStep);
        markValidationAttempted(targetStep);
      }
      setSubmitError('Please fix the highlighted fields.');
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
    sessionDraft,
    topup.fieldErrors,
    topupProductError
  ]);
  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    if (
      lockTopupLoan &&
      (snapshot.draft.isTopup !== true || snapshot.draft.loanIdToClose !== initialDraft?.loanIdToClose)
    ) {
      sessionDraft.discard();
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
                  schedulePreview.stale)) ||
              (draft.isTopup === true &&
                topup.loading &&
                (stepId === 'core' ||
                  stepId === 'financial' ||
                  stepId === 'timeline' ||
                  stepId === 'preview'))
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
                  void loadProductTemplate(patch.productId, lockTopupLoan);
                }
              }}
            />
            {topup.visible || lockTopupLoan ? (
              <div className="mt-6">
                <LoanTopupFields
                  enabled={lockTopupLoan || draft.isTopup === true}
                  locked={lockTopupLoan}
                  loanIdToClose={draft.loanIdToClose}
                  options={topup.options}
                  optionLabel={topup.optionLabel}
                  currencyCode={template.currency?.code ?? 'USD'}
                  errors={stepErrors}
                  loading={topup.loading}
                  payoff={topup.context?.payoff}
                  cashToClient={topup.cashToClient}
                  omittedInterestBased={topup.omittedInterestBased}
                  pendingWarning={topup.pendingWarning}
                  onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
                />
              </div>
            ) : null}
          </>
        ) : null}
        {stepId === 'financial' ? (
          <LoanAccountFinancialStep
            template={template}
            draft={draft}
            errors={stepErrors}
            topupPayoff={draft.isTopup ? topup.context?.payoff : null}
            topupCashToClient={draft.isTopup ? topup.cashToClient : null}
            topupOmittedInterestBased={draft.isTopup ? topup.omittedInterestBased : false}
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
            originatorOptions={originatorOptions}
            isEdit={isEdit}
            borrowerClientId={Number(clientId)}
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
          <LoanAccountPreviewStep
            template={template}
            draft={draft}
            originatorOptions={originatorOptions}
            topupQuote={
              draft.isTopup
                ? {
                    loanLabel: topup.selectedLabel,
                    payoff: topup.context?.payoff,
                    cashToClient: topup.cashToClient,
                    pendingWarning: topup.pendingWarning,
                    omittedInterestBased: topup.omittedInterestBased
                  }
                : null
            }
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
export function CreateLoanAccountWizard({
  clientId,
  clientDisplayName,
  initialTemplate,
  initialDraft,
  originatorOptions
}: {
  clientId: string;
  clientDisplayName?: string;
  initialTemplate: ClientLoanAccountTemplate;
  initialDraft?: LoanAccountDraft;
  originatorOptions?: LoanOriginatorListItem[];
}) {
  return (
    <LoanAccountWizard
      mode="create"
      clientId={clientId}
      clientDisplayName={clientDisplayName}
      initialTemplate={initialTemplate}
      initialDraft={initialDraft}
      originatorOptions={originatorOptions}
    />
  );
}
