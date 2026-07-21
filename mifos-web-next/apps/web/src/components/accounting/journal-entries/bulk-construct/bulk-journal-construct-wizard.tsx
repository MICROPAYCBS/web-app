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
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { createBulkJournalEntriesAction } from '@/actions/journal-entries';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import {
  defaultBulkConstructRow,
  isBulkConstructEligibleRule
} from '@/lib/accounting/bulk-journal-construct';
import { BulkConstructReviewStep } from './steps/review-step';
import { BulkConstructTemplateStep } from './steps/template-step';
import { BulkConstructVariationsStep } from './steps/variations-step';
import type { BulkConstructWizardProps } from './types';
import {
  stepForBulkConstructField,
  validateBulkConstructDraft,
  validateBulkConstructStep
} from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'template', label: 'Template' },
  { id: 'variations', label: 'Variations' },
  { id: 'review', label: 'Review & post' }
];

const JOURNAL_ENTRIES_LIST_PATH = '/accounting/journal-entries';

export function BulkJournalConstructWizard(props: BulkConstructWizardProps) {
  const router = useRouter();
  const [form, setForm] = useState(props.initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [stepId, setStepId] = useState('template');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [postResults, setPostResults] = useState<
    | Array<
        | { rowIndex: number; ok: true; transactionId?: string; pending?: boolean }
        | { rowIndex: number; ok: false; message: string }
      >
    | null
  >(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

  const stepErrors = useMemo(() => {
    if (!validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateBulkConstructStep(
      stepId,
      form,
      props.validationContext,
      props.accountingRules,
      props.currencies
    );
  }, [
    form,
    props.accountingRules,
    props.currencies,
    props.validationContext,
    stepId,
    validationAttemptedStepIds
  ]);

  const invalidStepIdsForRail = useMemo(() => {
    const invalid = new Set<string>();
    for (const step of WIZARD_STEPS) {
      if (!validationAttemptedStepIds.has(step.id)) {
        continue;
      }
      const errors = validateBulkConstructStep(
        step.id,
        form,
        props.validationContext,
        props.accountingRules,
        props.currencies
      );
      if (Object.keys(errors).length > 0) {
        invalid.add(step.id);
      }
    }
    return [...invalid];
  }, [
    form,
    props.accountingRules,
    props.currencies,
    props.validationContext,
    validationAttemptedStepIds
  ]);

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

  function patchForm(patch: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function patchTemplate(patch: Partial<typeof form.template>) {
    setForm((current) => {
      const nextTemplate = { ...current.template, ...patch };
      const variationModeChanged =
        patch.variationMode != null && patch.variationMode !== current.template.variationMode;
      if (nextTemplate.variationMode === 'branch') {
        // Department is chosen per branch row from mapped options.
        nextTemplate.departmentId = undefined;
      }
      return {
        ...current,
        template: nextTemplate,
        rows: variationModeChanged
          ? current.rows.map(() => defaultBulkConstructRow(nextTemplate.variationMode))
          : current.rows
      };
    });
  }

  function patchRows(rows: typeof form.rows) {
    setForm((current) => ({ ...current, rows }));
  }

  function goToStep(nextStepId: string) {
    setStepId(nextStepId);
  }

  function goBack() {
    const prev = WIZARD_STEPS[currentIndex - 1];
    if (prev) {
      setStepId(prev.id);
    }
  }

  function tryNext() {
    setSubmitError(null);
    markValidationAttempted(stepId);
    const errors = validateBulkConstructStep(
      stepId,
      formRef.current,
      props.validationContext,
      props.accountingRules,
      props.currencies
    );
    if (Object.keys(errors).length > 0) {
      return;
    }
    const next = WIZARD_STEPS[currentIndex + 1];
    if (next) {
      setStepId(next.id);
    }
  }

  function handleSubmit() {
    setSubmitError(null);
    setPostResults(null);
    const errors = validateBulkConstructDraft(
      formRef.current,
      props.validationContext,
      props.accountingRules,
      props.currencies
    );
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0] ?? '';
      const targetStep = stepForBulkConstructField(firstKey);
      markValidationAttempted(targetStep);
      if (targetStep !== 'review') {
        setStepId(targetStep);
      }
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    const selectedRule = props.accountingRules.find(
      (rule) => rule.id === formRef.current.template.accountingRuleId
    );
    if (!selectedRule || !isBulkConstructEligibleRule(selectedRule)) {
      setSubmitError('Select a supported posting template.');
      setStepId('template');
      return;
    }

    startTransition(async () => {
      const result = await createBulkJournalEntriesAction(formRef.current);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        toastFineractError(result.message);
        return;
      }

      setPostResults(result.results);

      if (result.failureCount === 0) {
        toastCommandOutcome(
          {
            ok: true,
            pendingChecker: result.results.some((row) => row.ok && row.pending)
          },
          {
            completed: `${result.successCount} journal entries posted.`,
            pending: `${result.successCount} journal entries sent for approval.`
          }
        );
        router.push(JOURNAL_ENTRIES_LIST_PATH);
        router.refresh();
        return;
      }

      if (result.successCount > 0) {
        toastCommandOutcome(
          { ok: true },
          {
            completed: `${result.successCount} posted, ${result.failureCount} failed. Review the rows below.`
          }
        );
      } else {
        toastFineractError('No journal entries were posted.');
      }
      router.refresh();
    });
  }

  const stepProps = {
    ...props,
    form,
    errors: stepErrors,
    pending,
    onPatch: patchForm,
    onPatchTemplate: patchTemplate,
    onPatchRows: patchRows
  };

  return (
    <FormWizard
      embedded={props.embedded}
      steps={WIZARD_STEPS}
      currentStepId={stepId}
      title="Construct journal entries"
      description="Build multiple similar journal entries from one posting template, then post them together."
      onStepClick={goToStep}
      invalidStepIds={invalidStepIdsForRail}
      footer={
        <FormWizardFooter
          cancelHref={JOURNAL_ENTRIES_LIST_PATH}
          showBack={currentIndex > 0}
          onBack={goBack}
          backDisabled={pending}
          primaryLabel={isReview ? `Post ${form.rows.length} entries` : 'Next'}
          onPrimary={isReview ? handleSubmit : tryNext}
          primaryLoading={isReview && pending}
          primaryLoadingLabel="Posting…"
        />
      }
    >
      {stepId === 'template' ? <BulkConstructTemplateStep {...stepProps} /> : null}
      {stepId === 'variations' ? <BulkConstructVariationsStep {...stepProps} /> : null}
      {stepId === 'review' ? (
        <BulkConstructReviewStep
          {...stepProps}
          submitError={submitError}
          postResults={postResults}
        />
      ) : null}
    </FormWizard>
  );
}
