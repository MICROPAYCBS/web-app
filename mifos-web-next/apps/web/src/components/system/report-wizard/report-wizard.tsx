'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import type { UpsertReportFormInput } from '@mifos/validation';
import { useSession } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { createReportAction, updateReportAction } from '@/actions/reports';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { useUnsavedWizardLeave } from '@/components/composites/use-unsaved-wizard-leave';
import { useWizardSessionDraft } from '@/components/composites/use-wizard-session-draft';
import { WizardDraftRestoreBanner } from '@/components/composites/wizard-draft-restore-banner';
import { WizardLeaveConfirmDialog } from '@/components/composites/wizard-leave-confirm-dialog';
import type { ReportParameterRow } from '@/components/system/report-parameters-editor';
import {
  isSqlDisabledForReportType,
  isSubTypeEnabledForReportType
} from '@/lib/fineract/report-display';
import { wizardSubmitRecoveryMessage } from '@/lib/wizard-session-draft';
import { ReportCoreSettingsStep } from './steps/core-settings-step';
import { ReportDetailsStep } from './steps/details-step';
import { ReportParametersStep } from './steps/parameters-step';
import { ReportPreviewStep } from './steps/preview-step';
import { ReportQueryStep } from './steps/query-step';
import type { ReportWizardDraft, ReportWizardProps, StepErrors } from './types';
import {
  draftToPayload,
  reportDraftHasUnsavedChanges,
  stepForField,
  validateCoreReportDraft,
  validateReportDraft,
  validateReportStep
} from './validation';

const CORE_WIZARD_STEPS: FormWizardStep[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'query', label: 'Query' },
  { id: 'review', label: 'Review' }
];

function buildCustomWizardSteps(showQueryStep: boolean): FormWizardStep[] {
  return [
    { id: 'details', label: 'Basic details' },
    { id: 'parameters', label: 'Parameters' },
    ...(showQueryStep ? [{ id: 'query', label: 'Query' } as FormWizardStep] : []),
    { id: 'review', label: 'Review' }
  ];
}
const REPORT_WIZARD_SESSION_VERSION = 1;

export function ReportWizard({ mode, reportId, template, report, initialDraft }: ReportWizardProps) {
  const router = useRouter();
  const { user } = useSession();
  const coreReport = report?.coreReport === true;
  const allowedReportTypes =
    mode === 'edit' && report ? report.allowedReportTypes : template.allowedReportTypes;
  const allowedReportSubTypes =
    mode === 'edit' && report ? report.allowedReportSubTypes : template.allowedReportSubTypes;
  const allowedParameters =
    mode === 'edit' && report ? report.allowedParameters : template.allowedParameters;

  const [draft, setDraft] = useState<ReportWizardDraft>(initialDraft);
  const [stepId, setStepId] = useState(coreReport ? 'settings' : 'details');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const customShowQueryStep =
    !coreReport && !isSqlDisabledForReportType(draft.form.reportType);
  const coreShowQueryStep = coreReport && Boolean(draft.form.reportSql?.trim());
  const wizardSteps = useMemo(() => {
    if (coreReport) {
      return coreShowQueryStep
        ? CORE_WIZARD_STEPS
        : CORE_WIZARD_STEPS.filter((step) => step.id !== 'query');
    }
    return buildCustomWizardSteps(customShowQueryStep);
  }, [coreReport, coreShowQueryStep, customShowQueryStep]);

  const currentIndex = wizardSteps.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

  const hasUnsavedChanges = useMemo(
    () => reportDraftHasUnsavedChanges(draft, initialDraft, { coreReport }),
    [draft, initialDraft, coreReport]
  );
  const isSessionDraftDirty = useCallback(
    (value: ReportWizardDraft) =>
      reportDraftHasUnsavedChanges(value, initialDraft, { coreReport }),
    [initialDraft, coreReport]
  );
  const sessionDraft = useWizardSessionDraft({
    userId: user?.userId,
    wizardId: 'report',
    entityKey: mode === 'edit' && reportId != null ? String(reportId) : 'new',
    schemaVersion: REPORT_WIZARD_SESSION_VERSION,
    draft,
    stepId,
    isDirty: isSessionDraftDirty
  });
  useUnsavedWizardLeave(hasUnsavedChanges);

  const canSave = useMemo(() => {
    if (!hasUnsavedChanges) {
      return false;
    }
    const errors = coreReport ? validateCoreReportDraft(draft) : validateReportDraft(draft);
    return Object.keys(errors).length === 0;
  }, [coreReport, draft, hasUnsavedChanges]);

  useEffect(() => {
    if (!wizardSteps.some((step) => step.id === stepId)) {
      setStepId(wizardSteps[wizardSteps.length - 1]?.id ?? 'details');
    }
  }, [wizardSteps, stepId]);

  const cancelHref =
    mode === 'edit' && reportId != null ? `/system/reports/${reportId}` : '/system/reports';

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

  const validateCurrentStep = useCallback(
    (id: string) => {
      if (coreReport && id === 'query') {
        return {};
      }
      return validateReportStep(id, draft);
    },
    [coreReport, draft]
  );

  const invalidStepIdsForRail = useMemo(() => {
    return [...validationAttemptedStepIds].filter((id) => {
      if (id === 'review') {
        return false;
      }
      return Object.keys(validateCurrentStep(id)).length > 0;
    });
  }, [validationAttemptedStepIds, validateCurrentStep]);

  const stepErrors = useMemo((): StepErrors => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateCurrentStep(stepId);
  }, [validationAttemptedStepIds, stepId, validateCurrentStep, isReview]);

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
    const errors = validateCurrentStep(stepId);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isReview, stepId, draft, goNext, markValidationAttempted, validateCurrentStep]);

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
        const errors = validateCurrentStep(stepToValidate);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [wizardSteps, currentIndex, draft, markValidationAttempted, validateCurrentStep]
  );

  function patchForm(patch: Partial<UpsertReportFormInput>) {
    setDraft((current) => ({
      ...current,
      form: { ...current.form, ...patch }
    }));
  }

  function handleReportTypeChange(reportType: string | undefined) {
    if (!reportType) {
      return;
    }
    const patch: Partial<UpsertReportFormInput> = { reportType };
    if (!isSubTypeEnabledForReportType(reportType)) {
      patch.reportSubType = '';
    }
    if (isSqlDisabledForReportType(reportType)) {
      patch.reportSql = '';
    }
    patchForm(patch);
  }

  function setParameters(parameters: ReportParameterRow[]) {
    setDraft((current) => ({ ...current, parameters }));
  }

  function handleSubmit() {
    setSubmitError(null);
    if (!hasUnsavedChanges) {
      return;
    }
    const errors = coreReport ? validateCoreReportDraft(draft) : validateReportDraft(draft);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      if (firstKey && !coreReport) {
        setStepId(stepForField(firstKey, customShowQueryStep));
      } else if (coreReport) {
        setStepId('settings');
      }
      markValidationAttempted(stepForField(firstKey ?? 'review', customShowQueryStep));
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    const payload = draftToPayload(draft);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createReportAction(payload)
          : await updateReportAction(reportId as number, payload);

      if (!result.ok) {
        setSubmitError(
          wizardSubmitRecoveryMessage(formatActionErrorMessage(result.message, result.fieldErrors))
        );
        toastFineractError(result.message);
        return;
      }
      sessionDraft.clear();
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Report created.' : 'Report updated.', pending: mode === 'create' ? 'Report created. sent for approval.' : 'Report updated. sent for approval.' });
      router.push(`/system/reports/${result.resourceId ?? reportId}`);
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create report' : `Edit ${report?.reportName ?? 'report'}`;
  const description = coreReport
    ? 'Update menu visibility and description. Report SQL is shown read-only when available.'
    : mode === 'create'
      ? 'Define report parameters, query, and menu visibility.'
      : 'Update report parameters, query, and visibility.';

  const stepProps = {
    draft,
    errors: stepErrors,
    disabled: pending,
    allowedReportTypes,
    allowedReportSubTypes,
    allowedParameters,
    fieldsLocked: coreReport,
    onFormChange: patchForm,
    onParametersChange: setParameters,
    onReportTypeChange: handleReportTypeChange
  };

  function handleResumeDraft() {
    const snapshot = sessionDraft.resume();
    if (!snapshot) {
      return;
    }
    setDraft(snapshot.draft);
    setStepId(snapshot.stepId);
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      setLeaveOpen(true);
      return;
    }
    router.push(cancelHref);
  }

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
              isReview ? (mode === 'create' ? 'Create report' : 'Save changes') : 'Next'
            }
            onPrimary={isReview ? handleSubmit : tryNext}
            primaryDisabled={isReview && !canSave}
            primaryLoading={isReview && pending}
            primaryLoadingLabel={mode === 'create' ? 'Creating…' : 'Saving…'}
          />
        }
      >
        {coreReport && stepId === 'settings' ? (
          <ReportCoreSettingsStep
            {...stepProps}
            reportType={report?.reportType}
            reportCategory={report?.reportCategory}
          />
        ) : null}

        {stepId === 'query' && (coreReport ? coreShowQueryStep : customShowQueryStep) ? (
          <ReportQueryStep {...stepProps} readOnly={coreReport} />
        ) : null}

        {!coreReport && stepId === 'details' ? <ReportDetailsStep {...stepProps} /> : null}
        {!coreReport && stepId === 'parameters' ? <ReportParametersStep {...stepProps} /> : null}

        {isReview ? (
          <ReportPreviewStep
            draft={draft}
            mode={mode}
            coreReport={coreReport}
            saveDisabled={!canSave}
            hasUnsavedChanges={hasUnsavedChanges}
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
