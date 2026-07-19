/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractHookConfigField,
  FineractHookDetail,
  FineractHookTemplateName
} from '@mifos/api-client';
import type { UpsertHookFormInput } from '@mifos/validation';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function hookConfigValue(
  config: FineractHookConfigField[] | undefined,
  fieldName: string,
  fallbackIndex?: number
): string {
  if (!config?.length) {
    return '';
  }

  const byName = config.find(
    (field) => field.fieldName?.trim().toLowerCase() === fieldName.trim().toLowerCase()
  );
  if (byName?.fieldValue != null) {
    return String(byName.fieldValue);
  }

  if (fallbackIndex != null && config[fallbackIndex]?.fieldValue != null) {
    return String(config[fallbackIndex].fieldValue);
  }

  return '';
}

export function hookTemplateLabel(name: string): string {
  if (name === 'Web') {
    return 'Web hook';
  }
  if (name === 'SMS Bridge') {
    return 'SMS bridge';
  }
  return name;
}

export function formatHookDate(value: string | number[] | undefined): string {
  if (value == null) {
    return '—';
  }
  return formatFineractDateArray(value) ?? '—';
}

export function hookToFormValues(hook: FineractHookDetail): UpsertHookFormInput {
  const events = (hook.events ?? []).map((event) => ({
    entityName: event.entityName,
    actionName: event.actionName
  }));

  const base = {
    displayName: hook.displayName,
    isActive: hook.isActive === true,
    payloadUrl: '',
    events
  };

  if (hook.name === 'SMS Bridge') {
    return {
      ...base,
      name: 'SMS Bridge',
      payloadUrl: hookConfigValue(hook.config, 'Payload URL', 0),
      phoneNumber: hookConfigValue(hook.config, 'Phone Number', 1),
      smsProvider: hookConfigValue(hook.config, 'SMS Provider', 2),
      smsProviderAccountId: hookConfigValue(hook.config, 'SMS Provider Account Id', 3),
      smsProviderToken: hookConfigValue(hook.config, 'SMS Provider Token', 4)
    };
  }

  const contentType = hookConfigValue(hook.config, 'Content Type', 0);
  return {
    ...base,
    name: 'Web',
    contentType: contentType === 'form' ? 'form' : 'json',
    payloadUrl: hookConfigValue(hook.config, 'Payload URL', 1)
  };
}

export function defaultHookFormValues(
  templateName: FineractHookTemplateName = 'Web'
): UpsertHookFormInput {
  if (templateName === 'SMS Bridge') {
    return {
      name: 'SMS Bridge',
      displayName: '',
      isActive: false,
      payloadUrl: '',
      phoneNumber: '',
      smsProvider: '',
      smsProviderAccountId: '',
      smsProviderToken: '',
      events: []
    };
  }

  return {
    name: 'Web',
    displayName: '',
    isActive: false,
    contentType: 'json',
    payloadUrl: '',
    events: []
  };
}

export function formatHookEventLabel(event: { actionName: string; entityName: string }): string {
  return `${event.actionName} — ${event.entityName}`;
}
