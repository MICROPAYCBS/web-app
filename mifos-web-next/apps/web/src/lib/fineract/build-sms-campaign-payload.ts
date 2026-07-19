/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateSmsCampaignPayload,
  SmsCampaignActivateCommandInput,
  SmsCampaignCloseCommandInput,
  UpdateSmsCampaignPayload
} from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_DATETIME_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField,
  toFineractDate
} from '@/lib/fineract/dates';
import { SCHEDULED_TRIGGER_TYPE } from '@/lib/fineract/sms-campaign-display';

function baseLocaleFields(input: { locale?: string; dateFormat?: string; dateTimeFormat?: string }) {
  return {
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    dateTimeFormat: input.dateTimeFormat ?? FINERACT_DATETIME_FORMAT
  };
}

function providerPayload(isNotification: boolean, providerId: number | null | undefined) {
  if (isNotification) {
    return null;
  }
  if (providerId == null || providerId === 0) {
    return null;
  }
  return providerId;
}

export function buildCreateSmsCampaignPayload(input: CreateSmsCampaignPayload) {
  const body: Record<string, unknown> = {
    campaignName: input.campaignName,
    campaignType: input.isNotification ? 2 : 1,
    triggerType: input.triggerType,
    runReportId: input.runReportId,
    isNotification: input.isNotification,
    providerId: providerPayload(input.isNotification, input.providerId),
    message: input.message,
    paramValue: input.paramValue,
    submittedOnDate: toFineractDate(new Date()),
    ...baseLocaleFields(input)
  };

  if (input.triggerType === SCHEDULED_TRIGGER_TYPE) {
    body.recurrenceStartDate = input.recurrenceStartDate;
    body.frequency = input.frequency;
    body.interval = input.interval;
    if (input.repeatsOnDay != null) {
      body.repeatsOnDay = input.repeatsOnDay;
    }
  }

  return body;
}

export function buildUpdateSmsCampaignPayload(input: UpdateSmsCampaignPayload) {
  const body: Record<string, unknown> = {
    campaignName: input.campaignName,
    campaignType: input.isNotification ? 2 : 1,
    triggerType: input.triggerType,
    runReportId: input.runReportId,
    isNotification: input.isNotification,
    providerId: providerPayload(input.isNotification, input.providerId),
    message: input.message,
    paramValue: input.paramValue,
    ...baseLocaleFields(input)
  };

  if (input.recurrenceStartDate?.trim()) {
    body.recurrenceStartDate = input.recurrenceStartDate;
  }

  return body;
}

export function buildSmsCampaignActivatePayload(input: SmsCampaignActivateCommandInput) {
  return {
    activationDate: normalizeFineractDateField(input.activationDate),
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT
  };
}

export function buildSmsCampaignClosePayload(input: SmsCampaignCloseCommandInput) {
  return {
    closureDate: normalizeFineractDateField(input.closureDate),
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT
  };
}
