'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { areJournalEntryTotalsBalanced } from '@mifos/domain';
import {
  formatActionErrorMessage,
  validateCreateJournalEntryForm,
  type CreateJournalEntryFormInput
} from '@mifos/validation';
import { Can } from '@mifos/auth';
import { Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { createJournalEntryAction } from '@/actions/journal-entries';
import { emptyJournalEntryLine } from '@/components/accounting/journal-entries/journal-entry-lines-editor';
import { useJournalEntryTransactionPanel } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { buttonVariants } from '@/components/ui/button';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import {
  JOURNAL_ENTRIES_BULK_OPERATIONS_LABEL,
  JOURNAL_ENTRIES_BULK_OPERATIONS_PATH
} from '@/lib/fineract/bulk-import-paths';
import { cn } from '@/lib/utils';
import { postingTemplateLinesForRule, isManualJournalEntryTemplateValue } from '@/lib/accounting/journal-entry-display';
import { DetailsStep } from './steps/details-step';
import { LinesStep } from './steps/lines-step';
import { ReviewStep } from './steps/review-step';
import type { JournalEntryWizardProps } from './types';
import {
  stepForField,
  validateJournalEntryDraft,
  validateJournalEntryStep
} from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'details', label: 'Posting details' },
  { id: 'lines', label: 'Journal lines' },
  { id: 'review', label: 'Review & post' }
];

const JOURNAL_ENTRIES_LIST_PATH = '/accounting/journal-entries';

export function JournalEntryWizard({
  initialValues,
  offices,
  currencies,
  paymentTypes,
  glAccounts,
  departments,
  accountingRules,
  validationContext
}: JournalEntryWizardProps) {
  const router = useRouter();
  const journalPanel = useJournalEntryTransactionPanel();
  const [form, setForm] = useState<CreateJournalEntryFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [stepId, setStepId] = useState('details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

  const isBalanced = useMemo(
    () => areJournalEntryTotalsBalanced(form.debits, form.credits),
    [form.debits, form.credits]
  );

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
      return Object.keys(validateJournalEntryStep(id, form, validationContext)).length > 0;
    });
  }, [validationAttemptedStepIds, form, validationContext]);

  const stepErrors = useMemo(() => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateJournalEntryStep(stepId, form, validationContext);
  }, [isReview, validationAttemptedStepIds, stepId, form, validationContext]);

  function patchForm(patch: Partial<CreateJournalEntryFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as CreateJournalEntryFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handlePostingTemplateChange(value: string | undefined) {
    if (isManualJournalEntryTemplateValue(value)) {
      patchForm({
        accountingRule: undefined,
        debits: [emptyJournalEntryLine()],
        credits: [emptyJournalEntryLine()]
      });
      return;
    }
    const ruleId = Number(value);
    const rule = accountingRules.find((entry) => entry.id === ruleId);
    if (!rule) {
      return;
    }
    const lineState = postingTemplateLinesForRule(rule);
    patchForm({
      accountingRule: ruleId,
      debits: lineState.debits,
      credits: lineState.credits
    });
  }

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
        const errors = validateJournalEntryStep(stepToValidate, formRef.current, validationContext);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          if (stepToValidate === 'lines' && errors.departmentId) {
            markValidationAttempted('details');
            setStepId('details');
          } else {
            setStepId(stepToValidate);
          }
          return;
        }
      }

      setStepId(targetStepId);
    },
    [currentIndex, markValidationAttempted, validationContext]
  );

  function goBack() {
    if (currentIndex > 0) {
      setStepId(WIZARD_STEPS[currentIndex - 1].id);
    }
  }

  function tryNext() {
    const errors = validateJournalEntryStep(stepId, formRef.current, validationContext);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      if (stepId === 'lines' && errors.departmentId) {
        markValidationAttempted('details');
        setStepId('details');
      }
      return;
    }
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setStepId(WIZARD_STEPS[currentIndex + 1].id);
    }
  }

  function handleSubmit() {
    setSubmitError(null);
    const errors = validateJournalEntryDraft(formRef.current, validationContext);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0] ?? '';
      const targetStep = stepForField(firstKey);
      markValidationAttempted(targetStep);
      if (targetStep !== 'review') {
        setStepId(targetStep);
      }
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    const parsed = validateCreateJournalEntryForm(formRef.current, validationContext);
    if (!parsed.success) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = await createJournalEntryAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        toastFineractError(result.message);
        return;
      }
      if (result.transactionId) {
        router.push(JOURNAL_ENTRIES_LIST_PATH);
        journalPanel.openJournalTransaction(result.transactionId);
      } else {
        router.push(JOURNAL_ENTRIES_LIST_PATH);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Journal entry created.',
        pending: 'Journal entry created sent for approval.'
      });
      router.refresh();
    });
  }

  const stepProps = {
    form,
    errors: stepErrors,
    pending,
    onPatch: patchForm,
    offices,
    currencies,
    paymentTypes,
    glAccounts,
    departments,
    accountingRules,
    validationContext,
    onPostingTemplateChange: handlePostingTemplateChange
  };

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={WIZARD_STEPS}
        currentStepId={stepId}
        title="Create journal entry"
        description="Post a journal entry manually or start from an accounting rule template."
        actions={
          <Can permission="READ_JOURNALENTRY">
            <Link
              href={JOURNAL_ENTRIES_BULK_OPERATIONS_PATH}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              <Layers className="mr-2 size-4" />
              {JOURNAL_ENTRIES_BULK_OPERATIONS_LABEL}
            </Link>
          </Can>
        }
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        footer={
          <FormWizardFooter
            cancelHref={JOURNAL_ENTRIES_LIST_PATH}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={isReview ? 'Post entry' : 'Next'}
            onPrimary={isReview ? handleSubmit : tryNext}
            primaryDisabled={isReview ? !isBalanced : false}
            primaryLoading={isReview && pending}
            primaryLoadingLabel="Posting…"
          />
        }
      >
        {stepId === 'details' ? <DetailsStep {...stepProps} /> : null}
        {stepId === 'lines' ? <LinesStep {...stepProps} /> : null}
        {stepId === 'review' ? <ReviewStep {...stepProps} submitError={submitError} /> : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
