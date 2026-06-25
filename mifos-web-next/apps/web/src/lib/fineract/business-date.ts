/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import {
  BUSINESS_DATE_TYPE,
  COB_DATE_TYPE,
  type FineractBusinessDateEntry,
  type FineractBusinessDateType,
  type FineractBusinessDateUpdateResponse
} from '@mifos/api-client';
import type { UpdateBusinessDateInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  parseFineractDateString,
  toFineractDate
} from '@/lib/fineract/dates';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import type { BusinessDateContextValue } from '@/lib/fineract/business-date-context';
import { EMPTY_BUSINESS_DATE_CONTEXT } from '@/lib/fineract/business-date-context';

export const ENABLE_BUSINESS_DATE_CONFIG_NAME = 'enable-business-date';

const BUSINESS_DATE_PATH = '/businessdate';

export type BusinessDatePageSnapshot = {
  enabled: boolean;
  configurationName: string;
  dateFormat: string;
  locale: string;
  businessDate?: string;
  cobDate?: string;
};

function resolveBusinessDateType(raw: unknown): FineractBusinessDateType | null {
  if (raw === BUSINESS_DATE_TYPE || raw === COB_DATE_TYPE) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const row = raw as Record<string, unknown>;
    const code = row.code;
    if (typeof code === 'string') {
      if (code.endsWith('BUSINESS_DATE')) {
        return BUSINESS_DATE_TYPE;
      }
      if (code.endsWith('COB_DATE')) {
        return COB_DATE_TYPE;
      }
    }
    const value = row.value;
    if (value === BUSINESS_DATE_TYPE || value === COB_DATE_TYPE) {
      return value;
    }
  }
  return null;
}

function normalizeBusinessDateEntry(raw: unknown): FineractBusinessDateEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const type = resolveBusinessDateType(row.type);
  if (!type) {
    return null;
  }
  const date = row.date;
  if (typeof date === 'string' || Array.isArray(date)) {
    return { type, date };
  }
  return null;
}

function normalizeBusinessDateList(raw: unknown): FineractBusinessDateEntry[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeBusinessDateEntry(item))
      .filter((item): item is FineractBusinessDateEntry => item !== null);
  }
  const single = normalizeBusinessDateEntry(raw);
  return single ? [single] : [];
}

export async function listBusinessDates(): Promise<FineractBusinessDateEntry[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BUSINESS_DATE_PATH);
  return normalizeBusinessDateList(raw);
}

export async function getBusinessDatePageSnapshot(): Promise<BusinessDatePageSnapshot> {
  const configuration = await getGlobalConfigurationByName(ENABLE_BUSINESS_DATE_CONFIG_NAME);
  const snapshot: BusinessDatePageSnapshot = {
    enabled: configuration?.enabled === true,
    configurationName: ENABLE_BUSINESS_DATE_CONFIG_NAME,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };

  if (!snapshot.enabled) {
    return snapshot;
  }

  const entries = await listBusinessDates();
  for (const entry of entries) {
    const formDate = fineractApiDateToFormString(entry.date);
    if (!formDate) {
      continue;
    }
    if (entry.type === BUSINESS_DATE_TYPE) {
      snapshot.businessDate = formDate;
    } else if (entry.type === COB_DATE_TYPE) {
      snapshot.cobDate = formDate;
    }
  }

  return snapshot;
}

function formatBusinessDateDisplayLabel(formDate: string): string | null {
  const parsed = parseFineractDateString(formDate);
  if (!parsed) {
    return formDate;
  }

  return new Intl.DateTimeFormat(FINERACT_LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(parsed);
}

export async function getBusinessDateContext(): Promise<BusinessDateContextValue> {
  const configuration = await getGlobalConfigurationByName(ENABLE_BUSINESS_DATE_CONFIG_NAME);
  if (!configuration?.enabled) {
    return EMPTY_BUSINESS_DATE_CONTEXT;
  }

  const entries = await listBusinessDates();
  const businessDateEntry = entries.find((entry) => entry.type === BUSINESS_DATE_TYPE);
  if (!businessDateEntry) {
    return { enabled: true };
  }

  const formDate = fineractApiDateToFormString(businessDateEntry.date);
  if (!formDate) {
    return { enabled: true };
  }

  return {
    enabled: true,
    date: formDate,
    displayLabel: formatBusinessDateDisplayLabel(formDate) ?? formDate
  };
}

/** Long-form label for the site header when business date is enabled and set. */
export async function getBusinessDateHeaderLabel(): Promise<string | null> {
  const context = await getBusinessDateContext();
  return context.displayLabel ?? null;
}

export async function getDefaultTransactionDate(): Promise<string> {
  const context = await getBusinessDateContext();
  if (context.date?.trim()) {
    return context.date;
  }
  return toFineractDate();
}

export async function updateBusinessDate(
  input: UpdateBusinessDateInput
): Promise<FineractBusinessDateUpdateResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractBusinessDateUpdateResponse>(BUSINESS_DATE_PATH, input);
}
