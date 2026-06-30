'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ClientLoanAccountTemplate } from '@mifos/api-client';

import { formatActionErrorMessage } from '@mifos/validation';

import { useRouter } from 'next/navigation';

import { useCallback, useMemo, useState, useTransition } from 'react';

import {

  createClientLoanAccountAction,

  fetchClientLoanAccountTemplateAction

} from '@/actions/client-loan-account';

import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';

import { FormWizardFooter } from '@/components/composites/form-wizard-footer';

import { isClientLoanAccountTemplate } from '@/lib/fineract/client-account-action-result';

import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';

import {

  emptyLoanAccountDraft,

  loanAccountDraftFromTemplate,

  mergeLoanAccountCoreStep,

  mergeLoanAccountFinancialStep,

  mergeLoanAccountPayoutStep,

  mergeLoanAccountSecurityStep,

  mergeLoanAccountTimelineStep,

  type LoanAccountDraft

} from '@/lib/fineract/client-loan-account-draft';

import { LoanAccountCoreStep } from './steps/core-step';

import { LoanAccountFinancialStep } from './steps/financial-step';

import { LoanAccountPayoutStep } from './steps/payout-step';

import { LoanAccountPreviewStep } from './steps/preview-step';

import { LoanAccountSecurityStep } from './steps/security-step';

import { LoanAccountTimelineStep } from './steps/timeline-step';

import { validateLoanAccountStep } from './validation';



const WIZARD_STEPS: FormWizardStep[] = [

  { id: 'core', label: 'Product' },

  { id: 'financial', label: 'Terms' },

  { id: 'timeline', label: 'Interest' },

  { id: 'security', label: 'Security' },

  { id: 'payout', label: 'Payout' },

  { id: 'preview', label: 'Preview' }

];



export function CreateLoanAccountWizard({

  clientId,

  clientDisplayName,

  initialTemplate

}: {

  clientId: string;

  clientDisplayName?: string;

  initialTemplate: ClientLoanAccountTemplate;

}) {

  const router = useRouter();

  const [template, setTemplate] = useState(initialTemplate);

  const [draft, setDraft] = useState<LoanAccountDraft>(emptyLoanAccountDraft());

  const [stepId, setStepId] = useState('core');

  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(

    () => new Set()

  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();



  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);

  const isPreview = stepId === 'preview';

  const cancelHref = `/clients/${clientId}/loans`;



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

      return Object.keys(validateLoanAccountStep(id, draft)).length > 0;

    });

  }, [validationAttemptedStepIds, draft]);



  const stepErrors = useMemo(() => {

    if (isPreview || !validationAttemptedStepIds.has(stepId)) {

      return {};

    }

    return validateLoanAccountStep(stepId, draft);

  }, [validationAttemptedStepIds, stepId, draft, isPreview]);



  const loadProductTemplate = useCallback(

    (productId: number) => {

      if (!productId) {

        return;

      }

      startTransition(async () => {

        const result = await fetchClientLoanAccountTemplateAction(clientId, String(productId));

        if (!isClientLoanAccountTemplate(result)) {

          return;

        }

        setTemplate(result);

        setDraft((current) => ({

          ...current,

          ...loanAccountDraftFromTemplate(result),

          productId,

          loanOfficerId: current.loanOfficerId,

          loanPurposeId: current.loanPurposeId,

          fundId: current.fundId,

          externalId: current.externalId,

          submittedOnDate: current.submittedOnDate,

          expectedDisbursementDate: current.expectedDisbursementDate,

          linkAccountId: current.linkAccountId,

          disburseToSavings: current.disburseToSavings,

          collateral: current.collateral,

          guarantors: current.guarantors

        }));

      });

    },

    [clientId]

  );



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

        const errors = validateLoanAccountStep(stepToValidate, draft);

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



  const tryNext = useCallback(() => {

    markValidationAttempted(stepId);

    const errors = validateLoanAccountStep(stepId, draft);

    if (Object.keys(errors).length > 0) {

      return;

    }

    if (stepId === 'core' && draft.productId > 0) {

      loadProductTemplate(draft.productId);

    }

    goNext();

  }, [markValidationAttempted, stepId, draft, loadProductTemplate, goNext]);



  const handleSubmit = useCallback(() => {

    markValidationAttempted('preview');

    const errors = validateLoanAccountStep('preview', draft);

    if (Object.keys(errors).length > 0) {

      return;

    }

    setSubmitError(null);

    startTransition(async () => {

      const result = await createClientLoanAccountAction(clientId, draft);

      if (!toastCommandOutcome(result, {
        completed: 'Loan application submitted.',
        pending: 'Loan application sent for approval.'
      })) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      if (result.resourceId) {

        router.push(clientAccountGeneralPath(clientId, 'loan', result.resourceId));

      } else {

        router.push(cancelHref);

      }

      router.refresh();

    });

  }, [markValidationAttempted, draft, clientId, router, cancelHref]);



  return (

    <div className="flex min-h-0 flex-1 flex-col">

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

        title="Apply for loan"

        description={

          clientDisplayName

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

            primaryLabel={isPreview ? 'Submit application' : 'Next'}

            onPrimary={isPreview ? handleSubmit : tryNext}

            primaryLoading={isPreview && pending}

            primaryLoadingLabel="Submitting…"

            primaryDisabled={pending}

          />

        }

      >

        {stepId === 'core' ? (

          <LoanAccountCoreStep

            template={template}

            draft={draft}

            errors={stepErrors}

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

            onChange={(patch) =>

              setDraft((current) => mergeLoanAccountPayoutStep(current, patch))

            }

          />

        ) : null}

        {stepId === 'preview' ? (

          <LoanAccountPreviewStep template={template} draft={draft} />

        ) : null}

      </FormWizard>

    </div>

  );

}

