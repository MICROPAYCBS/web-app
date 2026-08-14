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
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';

import { FormWizardFooter } from '@/components/composites/form-wizard-footer';

import { isClientLoanAccountTemplate } from '@/lib/fineract/client-account-action-result';

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

  const productTemplateRequestRef = useRef(0);

  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const [scheduleStepError, setScheduleStepError] = useState<string | null>(null);

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
    async (productId: number) => {
      if (!productId) {
        return;
      }

      const requestId = ++productTemplateRequestRef.current;
      setProductTemplateLoading(true);

      try {
        const result = await fetchClientLoanAccountTemplateAction(clientId, String(productId));
        if (requestId !== productTemplateRequestRef.current) {
          return;
        }

        if (!isClientLoanAccountTemplate(result)) {
          console.warn('[loan application] template charge fields', {
            source: 'product-template-error',
            clientId,
            productId,
            result
          });
          return;
        }

        applyProductTemplate(productId, result);
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

    if (stepId === 'core' && draft.productId > 0 && !isEdit) {
      await loadProductTemplate(draft.productId);
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
    isEdit
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
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
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
    loanId
  ]);



  return (

    <PlatformRouteLayout>

      {submitError ? (

        <p

          className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive lg:mx-8"

          role="alert"

        >

          {formatActionErrorMessage(submitError)}

        </p>

      ) : null}

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

        footer={

          <FormWizardFooter

            cancelHref={cancelHref}

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

          <LoanAccountCoreStep

            template={template}

            draft={draft}

            errors={stepErrors}

            productLocked={isEdit}

            onChange={(patch) => {

              setDraft((current) => mergeLoanAccountCoreStep(current, patch));

              if (patch.productId && patch.productId !== draft.productId) {

                loadProductTemplate(patch.productId);

              }

            }}

          />

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
