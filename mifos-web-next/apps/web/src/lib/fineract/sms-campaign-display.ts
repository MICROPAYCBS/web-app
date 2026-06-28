/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportRunParameterMetadata,
  SmsCampaignBusinessRule,
  SmsCampaignDetail,
  SmsCampaignTemplate
} from '@mifos/api-client';
import { isReportParameterSelect } from '@mifos/domain';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export const SMS_MESSAGE_STATUS_TABS = [
  { label: 'Pending SMS', status: 100 },
  { label: 'Waiting for delivery report', status: 150 },
  { label: 'Sent SMS', status: 200 },
  { label: 'Delivered SMS', status: 300 },
  { label: 'Failed SMS', status: 400 }
] as const;

export const SCHEDULED_TRIGGER_TYPE = 2;
export const TRIGGERED_TRIGGER_TYPE = 3;

export function filterBusinessRulesForTrigger(
  rules: SmsCampaignBusinessRule[],
  triggerType: number
): SmsCampaignBusinessRule[] {
  if (triggerType === TRIGGERED_TRIGGER_TYPE) {
    return rules.filter((rule) => rule.reportSubType === 'Triggered');
  }
  return rules.filter((rule) => rule.reportSubType !== 'Triggered');
}

export function repetitionIntervalsForFrequency(frequency: number): string[] {
  switch (frequency) {
    case 1:
    case 2:
      return ['1', '2', '3'];
    case 3:
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    case 4:
      return ['1', '2', '3', '4', '5'];
    default:
      return [];
  }
}

export function formatSmsCampaignStatus(value: string | undefined): string {
  if (!value) {
    return '—';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatSmsCampaignSubmittedOn(
  campaign: Pick<SmsCampaignDetail, 'smsCampaignTimeLine'>
): string {
  return formatFineractDateArray(campaign.smsCampaignTimeLine?.submittedOnDate) ?? '—';
}

export function parseSmsCampaignParamValue(
  paramValue: string | undefined
): Record<string, string | number | boolean> | null {
  if (!paramValue?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(paramValue) as Record<string, string | number | boolean>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function metadataToReportParameters(
  metadata: FineractReportRunParameterMetadata[]
): Array<FineractReportRunParameterMetadata & { parameterType?: string }> {
  return metadata.map((entry) => ({
    ...entry,
    parameterLabel: entry.parameterLabel || entry.parameterName,
    parameterVariable: entry.parameterVariable || entry.parameterName,
    parameterType:
      entry.parameterDisplayType === 'checkbox'
        ? 'checkbox'
        : entry.parameterDisplayType === 'date'
          ? 'date'
          : entry.parameterDisplayType
  }));
}

export function buildSmsCampaignParamValue(input: {
  reportName: string;
  metadata: FineractReportRunParameterMetadata[];
  values: Record<string, string>;
}): Record<string, string | number | boolean> {
  const formatted: Record<string, string | number | boolean> = {
    reportName: input.reportName
  };

  for (const parameter of input.metadata) {
    const fieldName = parameter.parameterVariable || parameter.parameterName;
    const key = parameter.parameterVariable || parameter.parameterName;
    const raw = input.values[fieldName];
    if (raw == null || raw === '') {
      continue;
    }
    if (isReportParameterSelect(parameter)) {
      formatted[key] = raw;
      continue;
    }
    formatted[key] = raw;
  }

  return formatted;
}

export function buildReportHeaderQueryValues(input: {
  metadata: FineractReportRunParameterMetadata[];
  values: Record<string, string>;
}): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const parameter of input.metadata) {
    const fieldName = parameter.parameterVariable || parameter.parameterName;
    const raw = input.values[fieldName];
    if (raw == null || raw === '') {
      continue;
    }
    formatted[fieldName] = raw;
  }
  return formatted;
}

export function optionLabel(
  options: SmsCampaignTemplate['triggerTypeOptions'],
  id: number | undefined
): string {
  if (id == null) {
    return '—';
  }
  return options.find((option) => option.id === id)?.value ?? String(id);
}
