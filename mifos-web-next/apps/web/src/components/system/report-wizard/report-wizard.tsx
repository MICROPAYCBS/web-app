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
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createReportAction, updateReportAction } from '@/actions/reports';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import type { ReportParameterRow } from '@/components/system/report-parameters-editor';
import {
  isSqlDisabledForReportType,
  isSubTypeEnabledForReportType
} from '@/lib/fineract/report-display';
import { ReportCoreSettingsStep } from './steps/core-settings-step';
import { ReportDetailsStep } from './steps/details-step';
import { ReportParametersStep } from './steps/parameters-step';
import { ReportPreviewStep } from './steps/preview-step';
import { ReportQueryStep } from './steps/query-step';
import type { ReportWizardDraft, ReportWizardProps, StepErrors } from './types';
import {
  draftToPayload,
  stepForField,
  validateCoreReportDraft,
  validateReportDraft,
  validateReportStep
} from './validation';

const CORE_WIZARD_STEPS: FormWizardStep[] = [
  { id: 'settings', label: 'Settings' },
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

export function ReportWizard({ mode, reportId, template, report, initialDraft }: ReportWizardProps) {
  const router = useRouter();
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

  const showQueryStep = !coreReport && !isSqlDisabledForReportType(draft.form.reportType);
  const wizardSteps = useMemo(
    () => (coreReport ? CORE_WIZARD_STEPS : buildCustomWizardSteps(showQueryStep)),
    [coreReport, showQueryStep]
  );

  const currentIndex = wizardSteps.findIndex((step) => step.id === stepId);
  const isReview = stepId === 'review';

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

  const invalidStepIdsForRail = useMemo(() => {
    return [...validationAttemptedStepIds].filter((id) => {
      if (id === 'review') {
        return false;
      }
      return Object.keys(validateReportStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo((): StepErrors => {
    if (isReview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateReportStep(stepId, draft);
  }, [validationAttemptedStepIds, stepId, draft, isReview]);

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
    const errors = validateReportStep(stepId, draft);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(stepId);
      return;
    }
    goNext();
  }, [isReview, stepId, draft, goNext, markValidationAttempted]);

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
        const errors = validateReportStep(stepToValidate, draft);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [wizardSteps, currentIndex, draft, markValidationAttempted]
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
    const errors = coreReport ? validateCoreReportDraft(draft) : validateReportDraft(draft);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      if (firstKey && !coreReport) {
        setStepId(stepForField(firstKey, showQueryStep));
      } else if (coreReport) {
        setStepId('settings');
      }
      markValidationAttempted(stepForField(firstKey ?? 'review', showQueryStep));
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

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Report created.' : 'Report updated.', pending: mode === 'create' ? 'Report created. sent for approval.' : 'Report updated. sent for approval.' });
      router.push(`/system/reports/${result.resourceId ?? reportId}`);
      router.refresh();
    });
  }

  const title = mode === 'create' ? 'Create report' : `Edit ${report?.reportName ?? 'report'}`;
  const description = coreReport
    ? 'Core reports only allow updating the user menu flag and description.'
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

  return (
    <PlatformRouteLayout>
      <FormWizard
        steps={wizardSteps}
        currentStepId={stepId}
        title={title}
        description={description}
        onStepClick={goToStep}
        invalidStepIds={invalidStepIdsForRail}
        footer={
          <FormWizardFooter
            cancelHref={cancelHref}
            showBack={currentIndex > 0}
            onBack={goBack}
            backDisabled={pending}
            primaryLabel={
              isReview ? (mode === 'create' ? 'Create report' : 'Save changes') : 'Next'
            }
            onPrimary={isReview ? handleSubmit : tryNext}
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

        {!coreReport && stepId === 'details' ? <ReportDetailsStep {...stepProps} /> : null}
        {!coreReport && stepId === 'parameters' ? <ReportParametersStep {...stepProps} /> : null}
        {!coreReport && stepId === 'query' && showQueryStep ? <ReportQueryStep {...stepProps} /> : null}

        {isReview ? (
          <ReportPreviewStep
            draft={draft}
            submitError={submitError}
            mode={mode}
            coreReport={coreReport}
          />
        ) : null}
      </FormWizard>
    </PlatformRouteLayout>
  );
}
