'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createApprovalWorkflowAction, updateApprovalWorkflowAction } from '@/actions/approval-workflows';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import {
  APPROVAL_WORKFLOWS_LIST_PATH,
  approvalWorkflowDetailPath
} from '@/lib/fineract/approval-workflow-paths';
import {
  isWorkflowInProgressUpdateError,
  WORKFLOW_IN_PROGRESS_UPDATE_HINT
} from '@/lib/fineract/approval-workflow-display';
import { BasicsStep } from './steps/basics-step';
import { ReviewStep } from './steps/review-step';
import { StagesStep } from './steps/stages-step';
import { TransitionsStep } from './steps/transitions-step';
import type { ApprovalWorkflowWizardProps, StepErrors } from './types';
import {
  stepForField,
  validateWorkflowWizardDraft,
  validateWorkflowWizardStep
} from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'stages', label: 'Stages' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'review', label: 'Review' }
];

export function ApprovalWorkflowWizard({
  mode = 'create',
  definitionId,
  workflowName,
  definitionStatus,
  initialValues,
  taskPermissions,
  roles
}: ApprovalWorkflowWizardProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const cancelHref =
    isEdit && definitionId != null
      ? approvalWorkflowDetailPath(definitionId)
      : APPROVAL_WORKFLOWS_LIST_PATH;
  const wizardTitle = isEdit
    ? workflowName?.trim()
      ? `Edit ${workflowName.trim()}`
      : 'Edit approval workflow'
    : 'Create approval workflow';
  const wizardDescription = isEdit
    ? definitionStatus === 'ACTIVE' || definitionStatus === 'INACTIVE'
      ? 'Saving replaces stages and transitions in place. Updates are blocked while approvals for this workflow are still in progress.'
      : 'Draft workflows can be fully replaced. Activate when the structure is ready.'
    : 'Define stages and transitions for a maker-checker task. New workflows start in draft status.';
  const [draft, setDraft] = useState(initialValues);
  const [stepId, setStepId] = useState('basics');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

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
      return Object.keys(validateWorkflowWizardStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateWorkflowWizardStep(stepId, draft);
  }, [validationAttemptedStepIds, stepId, draft, isReview]);

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

  const tryNext = useCallback(() => {
    if (isReview) {
      return;
    }
    const errors = validateWorkflowWizardStep(stepId, draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isReview, stepId, draft, goNext, markValidationAttempted]);

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
        const errors = validateWorkflowWizardStep(stepToValidate, draft);
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

  function handleSubmit() {
    setSubmitError(null);
    const errors = validateWorkflowWizardDraft(draft);
    if (Object.keys(errors).length > 0) {
      for (const step of WIZARD_STEPS) {
        if (step.id !== 'review' && Object.keys(validateWorkflowWizardStep(step.id, draft)).length) {
          markValidationAttempted(step.id);
        }
      }
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        setStepId(stepForField(firstErrorKey));
      } else {
        setStepId('review');
      }
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        isEdit && definitionId != null
          ? await updateApprovalWorkflowAction(definitionId, draft)
          : await createApprovalWorkflowAction(draft);

      if (!result.ok) {
        const baseMessage = formatActionErrorMessage(result.message, result.fieldErrors);
        setSubmitError(
          isWorkflowInProgressUpdateError(baseMessage)
            ? `${baseMessage}\n\n${WORKFLOW_IN_PROGRESS_UPDATE_HINT}`
            : baseMessage
        );
        if (result.fieldErrors) {
          const firstField = Object.keys(result.fieldErrors)[0];
          if (firstField) {
            setStepId(stepForField(firstField));
          }
        }
        toast.error(result.message);
        return;
      }

      toast.success(isEdit ? 'Workflow updated.' : 'Workflow created.');
      if (isEdit && definitionId != null) {
        router.push(approvalWorkflowDetailPath(definitionId));
      } else if (result.resourceId != null) {
        router.push(approvalWorkflowDetailPath(result.resourceId));
      } else {
        router.push(APPROVAL_WORKFLOWS_LIST_PATH);
      }
      router.refresh();
    });
  }

  const stepProps = {
    draft,
    taskPermissions,
    roles,
    errors: stepErrors,
    disabled: pending,
    onChange: (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }))
  };

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={WIZARD_STEPS}
        currentStepId={stepId}
        title={wizardTitle}
        description={wizardDescription}
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        footer={
          <FormWizardFooter
            cancelHref={cancelHref}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={isReview ? (isEdit ? 'Save changes' : 'Create workflow') : 'Next'}
            onPrimary={isReview ? handleSubmit : tryNext}
            primaryLoading={isReview && pending}
            primaryLoadingLabel={isEdit ? 'Saving…' : 'Creating…'}
          />
        }
      >
        {stepId === 'basics' ? <BasicsStep {...stepProps} /> : null}
        {stepId === 'stages' ? <StagesStep {...stepProps} /> : null}
        {stepId === 'transitions' ? <TransitionsStep {...stepProps} /> : null}
        {stepId === 'review' ? (
          <ReviewStep
            {...stepProps}
            mode={mode}
            definitionStatus={definitionStatus}
            submitError={submitError}
          />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
