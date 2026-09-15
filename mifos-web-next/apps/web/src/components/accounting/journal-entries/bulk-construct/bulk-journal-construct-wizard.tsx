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
import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { createBulkJournalEntriesAction } from '@/actions/journal-entries';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import {
  defaultBulkConstructRow,
  isBulkConstructEligibleRule
} from '@/lib/accounting/bulk-journal-construct';
import { wizardDraftsEqual, wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
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
const BULK_JOURNAL_WIZARD_SESSION_VERSION = 1;

export function BulkJournalConstructWizard(props: BulkConstructWizardProps) {
  const router = useRouter();
  const { user } = useSession();
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
  const [leaveOpen, setLeaveOpen] = useState(false);

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';
  const isSessionDraftDirty = useCallback(
    (value: typeof props.initialValues) => !wizardDraftsEqual(value, props.initialValues),
    [props.initialValues]
  );
  const sessionDirty = useMemo(
    () => !wizardDraftsEqual(form, props.initialValues),
    [form, props.initialValues]
  );
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: 'bulk-journal-construct',
    entityKey: 'new',
    schemaVersion: BULK_JOURNAL_WIZARD_SESSION_VERSION,
    draft: form,
    stepId,
    isDirty: isSessionDraftDirty
  });
  useUnsavedWizardLeave(sessionDirty);

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
        setSubmitError(
          wizardSubmitRecoveryMessage(formatActionErrorMessage(result.message, result.fieldErrors))
        );
        toastFineractError(result.message);
        return;
      }

      setPostResults(result.results);

      if (result.failureCount === 0) {
        sessionDraft.clear();
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

  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    setForm(snapshot.draft);
    setStepId(snapshot.stepId);
  }

  function handleCancel() {
    if (sessionDirty) {
      setLeaveOpen(true);
      return;
    }
    router.push(JOURNAL_ENTRIES_LIST_PATH);
  }

  return (
    <>
    <FormWizard
      embedded={props.embedded}
      steps={WIZARD_STEPS}
      currentStepId={stepId}
      title="Construct journal entries"
      description="Build multiple similar journal entries from one posting template, then post them together."
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
          cancelHref={JOURNAL_ENTRIES_LIST_PATH}
          onCancel={handleCancel}
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
          postResults={postResults}
        />
      ) : null}
    </FormWizard>
    <WizardLeaveConfirmDialog
      open={leaveOpen}
      onOpenChange={setLeaveOpen}
      onConfirmLeave={() => {
        setLeaveOpen(false);
        router.push(JOURNAL_ENTRIES_LIST_PATH);
      }}
    />
    </>
  );
}
