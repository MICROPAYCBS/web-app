'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { buildSmsCampaignParamValue, createSmsCampaignAction } from '@/actions/sms-campaign';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import {
  FINERACT_DATETIME_FORMAT,
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE
} from '@/lib/fineract/dates';
import { smsCampaignDetailPath, SMS_CAMPAIGN_LIST_PATH } from '@/lib/fineract/sms-campaign-paths';
import { SCHEDULED_TRIGGER_TYPE } from '@/lib/fineract/sms-campaign-display';
import { CampaignStep } from './steps/campaign-step';
import { MessageStep } from './steps/message-step';
import { PreviewStep } from './steps/preview-step';
import { createEmptySmsCampaignDraft, type SmsCampaignWizardProps } from './types';
import { validateWizardStep } from './validation';

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'message', label: 'Message' },
  { id: 'preview', label: 'Preview' }
];

function formatRecurrenceStartDate(value: string): string {
  if (!value.trim()) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, FINERACT_DATETIME_FORMAT);
}

export function SmsCampaignWizard({ template }: SmsCampaignWizardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(createEmptySmsCampaignDraft);
  const [stepId, setStepId] = useState('campaign');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  const isPreview = stepId === 'preview';

  const updateDraft = useCallback((patch: Partial<typeof draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

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
      return Object.keys(validateWizardStep(id, draft)).length > 0;
    });
  }, [validationAttemptedStepIds, draft]);

  const stepErrors = useMemo(() => {
    if (isPreview || !validationAttemptedStepIds.has(stepId)) {
      return {};
    }
    return validateWizardStep(stepId, draft);
  }, [validationAttemptedStepIds, stepId, draft, isPreview]);

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
    if (isPreview) {
      return;
    }
    markValidationAttempted(stepId);
    const errors = validateWizardStep(stepId, draft);
    if (Object.keys(errors).length) {
      return;
    }
    goNext();
  }, [draft, goNext, isPreview, markValidationAttempted, stepId]);

  const handleSubmit = useCallback(() => {
    setSubmitError(null);
    startTransition(async () => {
      const paramValue = buildSmsCampaignParamValue({
        reportName: draft.reportName,
        metadata: draft.businessRuleMetadata,
        values: draft.businessRuleValues
      }) as { reportName: string } & Record<string, string | number | boolean>;

      const result = await createSmsCampaignAction({
        campaignName: draft.campaignName.trim(),
        triggerType: Number(draft.triggerType),
        runReportId: Number(draft.runReportId),
        isNotification: draft.isNotification,
        providerId:
          draft.isNotification || draft.providerId === '' ? null : Number(draft.providerId),
        message: draft.message.trim(),
        paramValue,
        recurrenceStartDate:
          draft.triggerType === SCHEDULED_TRIGGER_TYPE
            ? formatRecurrenceStartDate(draft.recurrenceStartDate)
            : undefined,
        frequency:
          draft.triggerType === SCHEDULED_TRIGGER_TYPE ? Number(draft.frequency) : undefined,
        interval:
          draft.triggerType === SCHEDULED_TRIGGER_TYPE ? Number(draft.interval) : undefined,
        repeatsOnDay:
          draft.triggerType === SCHEDULED_TRIGGER_TYPE && draft.frequency === 2
            ? Number(draft.repeatsOnDay)
            : undefined,
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT,
        dateTimeFormat: FINERACT_DATETIME_FORMAT
      });

      if (!result.ok) {

        const message = formatActionErrorMessage(result.message, result.fieldErrors);
        setSubmitError(message);
        toast.error(message);
        return;
      }
      if (result.campaignId) {
        router.push(smsCampaignDetailPath(result.campaignId));
      } else {
        router.push(SMS_CAMPAIGN_LIST_PATH);
        return;
      }
      toastCommandOutcome(result, { completed: 'SMS campaign created', pending: 'SMS campaign created sent for approval.' });
      router.refresh();
    });
  }, [draft, router]);

  return (
    <FormWizard
      steps={WIZARD_STEPS}
      currentStepId={stepId}
      title="Create SMS campaign"
      description="Define the campaign, compose the message, and review before submitting."
      onStepClick={(id) => {
        if (WIZARD_STEPS.findIndex((step) => step.id === id) <= currentIndex) {
          setStepId(id);
        }
      }}
      invalidStepIds={invalidStepIdsForRail}
      footer={
        <FormWizardFooter
          cancelHref={SMS_CAMPAIGN_LIST_PATH}
          showBack={currentIndex > 0}
          onBack={goBack}
          primaryLabel={isPreview ? 'Submit' : 'Next'}
          onPrimary={isPreview ? handleSubmit : tryNext}
          primaryLoading={pending}
          primaryLoadingLabel={isPreview ? 'Creating…' : undefined}
        />
      }
    >
      {submitError ? <p className="mb-4 text-sm text-destructive">{submitError}</p> : null}
      {stepId === 'campaign' ? (
        <CampaignStep template={template} draft={draft} onChange={updateDraft} errors={stepErrors} />
      ) : null}
      {stepId === 'message' ? (
        <MessageStep draft={draft} onChange={updateDraft} errors={stepErrors} />
      ) : null}
      {stepId === 'preview' ? <PreviewStep template={template} draft={draft} /> : null}
    </FormWizard>
  );
}
