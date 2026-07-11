'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  formatActionErrorMessage,
  validateCentralBranchExpensePaymentForm,
  type CentralBranchExpensePaymentFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import {
  createCentralBranchExpensePaymentAction,
  reverseCentralBranchExpensePaymentAction,
  type CreateCentralBranchExpensePaymentResult
} from '@/actions/central-branch-expense-payments';
import { BranchExpensesStep } from '@/components/accounting/journal-entries/central-branch-payment/branch-expenses-step';
import { PaymentDetailsStep } from '@/components/accounting/journal-entries/central-branch-payment/payment-details-step';
import { ResultsStep } from '@/components/accounting/journal-entries/central-branch-payment/results-step';
import { ReviewPostStep } from '@/components/accounting/journal-entries/central-branch-payment/review-post-step';
import type { CentralBranchPaymentWizardProps } from '@/components/accounting/journal-entries/central-branch-payment/types';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { buttonVariants } from '@/components/ui/button';
import { centralBranchExpensePaymentTotal } from '@/lib/accounting/central-branch-expense-payment';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { cn } from '@/lib/utils';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'expenses', label: 'Branches' },
  { id: 'review', label: 'Review' },
  { id: 'results', label: 'Results' }
];

const LIST_PATH = '/accounting/journal-entries';

function flattenFieldErrors(
  fieldErrors: Record<string, string> | undefined
): Record<string, string> {
  return fieldErrors ?? {};
}

function validateStep(
  stepId: string,
  form: CentralBranchExpensePaymentFormInput,
  validationContext: CentralBranchPaymentWizardProps['validationContext']
): Record<string, string> {
  if (stepId === 'details') {
    const errors: Record<string, string> = {};
    if (!form.transactionDate.trim()) {
      errors.transactionDate = 'Transaction date is required.';
    }
    if (!form.currencyCode.trim()) {
      errors.currencyCode = 'Currency is required.';
    }
    if (form.fundingOfficeId <= 0) {
      errors.fundingOfficeId = 'Source office is required.';
    }
    if (form.bankGlAccountId <= 0) {
      errors.bankGlAccountId = 'Credit account is required.';
    }
    if (!form.referenceNumber.trim()) {
      errors.referenceNumber = 'Reference number is required.';
    }
    return errors;
  }

  if (stepId === 'expenses') {
    const parsed = validateCentralBranchExpensePaymentForm(form, {
      requireDepartmentOnExpenseLines: validationContext.requireDepartmentOnExpenseLines
    });
    if (!parsed.success) {
      return flattenFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.') || 'form',
            issue.message
          ])
        )
      );
    }
    if (centralBranchExpensePaymentTotal(form.expenseLines) <= 0) {
      return { expenseLines: 'Add at least one line with an amount greater than zero.' };
    }
  }

  return {};
}

export function CentralBranchPaymentWizard(props: CentralBranchPaymentWizardProps) {
  const router = useRouter();
  const [form, setForm] = useState(props.initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [postResult, setPostResult] = useState<
    (CreateCentralBranchExpensePaymentResult & { ok: true }) | null
  >(null);
  const [pending, startTransition] = useTransition();
  const [pendingReverse, startReverseTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';
  const isResults = stepId === 'results';

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
      if (id === 'review' || id === 'results') {
        return false;
      }
      return Object.keys(validateStep(id, form, props.validationContext)).length > 0;
    });
  }, [validationAttemptedStepIds, form, props.validationContext]);

  const stepErrors = useMemo(() => {
    if (isResults || isReview || !validationAttemptedStepIds.has(stepId)) {
      return serverFieldErrors;
    }
    return {
      ...serverFieldErrors,
      ...validateStep(stepId, form, props.validationContext)
    };
  }, [
    isResults,
    isReview,
    validationAttemptedStepIds,
    stepId,
    form,
    props.validationContext,
    serverFieldErrors
  ]);

  const stepProps = {
    ...props,
    form,
    errors: stepErrors,
    pending,
    onPatch: (patch: Partial<CentralBranchExpensePaymentFormInput>) => {
      setForm((current) => ({ ...current, ...patch }));
    }
  };

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
      if (targetIndex > currentIndex && !isResults) {
        for (let index = currentIndex; index < targetIndex; index += 1) {
          const step = WIZARD_STEPS[index];
          if (!step || step.id === 'results') {
            continue;
          }
          const nextStepErrors = validateStep(step.id, formRef.current, props.validationContext);
          if (Object.keys(nextStepErrors).length > 0) {
            markValidationAttempted(step.id);
            setStepId(step.id);
            return;
          }
        }
      }
      setServerFieldErrors({});
      setStepId(targetStepId);
    },
    [currentIndex, isResults, markValidationAttempted, props.validationContext]
  );

  function tryNext() {
    const nextStepErrors = validateStep(stepId, formRef.current, props.validationContext);
    if (Object.keys(nextStepErrors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    setServerFieldErrors({});
    const next = WIZARD_STEPS[currentIndex + 1];
    if (next) {
      setStepId(next.id);
    }
  }

  function goBack() {
    const previous = WIZARD_STEPS[currentIndex - 1];
    if (previous) {
      setStepId(previous.id);
    }
  }

  function handleSubmit() {
    setSubmitError(null);
    const expenseStepErrors = validateStep('expenses', formRef.current, props.validationContext);
    if (Object.keys(expenseStepErrors).length > 0) {
      markValidationAttempted('expenses');
      setStepId('expenses');
      return;
    }

    startTransition(async () => {
      const result = await createCentralBranchExpensePaymentAction(formRef.current);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        toastFineractError(result.message);
        if (result.fieldErrors) {
          const fieldErrors = flattenFieldErrors(result.fieldErrors);
          setServerFieldErrors(fieldErrors);
          const firstKey = Object.keys(fieldErrors)[0] ?? '';
          if (firstKey.startsWith('expenseLines')) {
            markValidationAttempted('expenses');
            setStepId('expenses');
          } else {
            markValidationAttempted('details');
            setStepId('details');
          }
        }
        return;
      }

      setPostResult(result);
      setStepId('results');
      if (result.failureCount === 0) {
        toastCommandOutcome(
          { ok: true },
          {
            completed: `Cross-branch entries posted (${result.successCount} journal entries).`,
            pending: 'Cross-branch entries sent for approval.'
          }
        );
      }
    });
  }

  function handleReversePosted() {
    if (!postResult) {
      return;
    }
    const transactionIds = postResult.results
      .filter((row): row is Extract<(typeof postResult.results)[number], { ok: true }> => row.ok)
      .map((row) => row.transactionId)
      .filter((id): id is string => Boolean(id?.trim()));
    if (transactionIds.length === 0) {
      return;
    }

    startReverseTransition(async () => {
      const result = await reverseCentralBranchExpensePaymentAction({ transactionIds });
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      const failures = result.results.filter((row) => !row.ok);
      if (failures.length > 0) {
        toastFineractError('Some posted entries could not be reversed. Review the batch manually.');
        return;
      }
      toastCommandOutcome({ ok: true }, { completed: 'Posted entries reversed.' });
    });
  }

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={WIZARD_STEPS}
        currentStepId={stepId}
        title="Cross-branch"
        description="Credits at one office, debits at consuming branches, cleared through inter-branch reconciliation."
        actions={
          <Link href={LIST_PATH} className={cn(buttonVariants({ variant: 'outline' }))}>
            Back to journal entries
          </Link>
        }
        onStepClick={isResults ? undefined : goToStep}
        invalidStepIds={invalidStepIdsForRail}
        footer={
          isResults ? (
            <FormWizardFooter
              cancelHref={LIST_PATH}
              showBack={false}
              primaryLabel="Done"
              onPrimary={() => router.push(LIST_PATH)}
            />
          ) : (
            <FormWizardFooter
              cancelHref={LIST_PATH}
              showBack={currentIndex > 0}
              onBack={goBack}
              primaryLabel={isReview ? 'Post' : 'Next'}
              onPrimary={isReview ? handleSubmit : tryNext}
              primaryLoading={isReview && pending}
              primaryDisabled={
                isReview &&
                (centralBranchExpensePaymentTotal(form.expenseLines) <= 0 ||
                  props.clearingGlAccountId <= 0)
              }
            />
          )
        }
      >
        {stepId === 'details' ? <PaymentDetailsStep {...stepProps} /> : null}
        {stepId === 'expenses' ? <BranchExpensesStep {...stepProps} /> : null}
        {stepId === 'review' ? <ReviewPostStep {...stepProps} /> : null}
        {stepId === 'results' && postResult ? (
          <ResultsStep
            result={postResult}
            pendingReverse={pendingReverse}
            onReversePosted={handleReversePosted}
          />
        ) : null}
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
