/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignWizardDraft } from './types';
import { SCHEDULED_TRIGGER_TYPE } from '@/lib/fineract/sms-campaign-display';

export type StepErrors = Record<string, string>;

export function validateCampaignStep(draft: SmsCampaignWizardDraft): StepErrors {
  const errors: StepErrors = {};
  if (!draft.campaignName.trim()) {
    errors.campaignName = 'Campaign name is required.';
  }
  if (draft.triggerType === '') {
    errors.triggerType = 'Trigger type is required.';
  }
  if (draft.runReportId === '') {
    errors.runReportId = 'Business rule is required.';
  }
  if (draft.triggerType === SCHEDULED_TRIGGER_TYPE) {
    if (!draft.recurrenceStartDate.trim()) {
      errors.recurrenceStartDate = 'Schedule date is required.';
    }
    if (draft.frequency === '') {
      errors.frequency = 'Repetition frequency is required.';
    }
    if (draft.interval === '') {
      errors.interval = 'Repetition interval is required.';
    }
    if (draft.frequency === 2 && draft.repeatsOnDay === '') {
      errors.repeatsOnDay = 'Repeats on day is required for weekly schedules.';
    }
  }

  for (const parameter of draft.businessRuleMetadata) {
    if (parameter.parentParameterName) {
      continue;
    }
    const fieldName = parameter.parameterVariable || parameter.parameterName;
    if (parameter.parameterDisplayType === 'none') {
      continue;
    }
    const value = draft.businessRuleValues[fieldName];
    if (!String(value ?? '').trim()) {
      errors[`businessRule.${fieldName}`] = `${parameter.parameterLabel || parameter.parameterName} is required.`;
    }
  }

  if (!draft.templateColumns.length) {
    errors.businessRule = 'Load template placeholders before continuing.';
  }

  return errors;
}

export function validateMessageStep(draft: SmsCampaignWizardDraft): StepErrors {
  const errors: StepErrors = {};
  if (!draft.message.trim()) {
    errors.message = 'Message is required.';
  }
  return errors;
}

export function validateWizardStep(stepId: string, draft: SmsCampaignWizardDraft): StepErrors {
  switch (stepId) {
    case 'campaign':
      return validateCampaignStep(draft);
    case 'message':
      return validateMessageStep(draft);
    default:
      return {};
  }
}
