'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractGlobalConfiguration,
  FineractGlobalConfigurationUpdateResponse
} from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpdateGlobalConfigurationEnabled,
  validateUpdateGlobalConfigurationValues
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  getGlobalConfiguration,
  updateGlobalConfigurationEnabled,
  updateGlobalConfigurationValues
} from '@/lib/fineract/global-configurations';
import { isKnownGlobalConfigurationStringValue } from '@/lib/fineract/global-configuration-string-options';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, normalizeFineractDateField } from '@/lib/fineract/dates';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/configurations';

export type GlobalConfigurationsActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function getGlobalConfigurationAction(
  configurationId: number
): Promise<GlobalConfigurationsActionResult<FineractGlobalConfiguration>> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_CONFIGURATION');
  } catch {
    return { ok: false, message: 'You do not have permission to view configurations.' };
  }

  if (!Number.isFinite(configurationId)) {
    return { ok: false, message: 'Invalid configuration id.' };
  }

  try {
    const configuration = await getGlobalConfiguration(configurationId);
    if (!configuration) {
      return { ok: false, message: 'Configuration not found.' };
    }
    return { ok: true, data: configuration };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load configuration.');
  }
}

export async function updateGlobalConfigurationEnabledAction(
  id: number,
  enabled: boolean
): Promise<GlobalConfigurationsActionResult<FineractGlobalConfigurationUpdateResponse>> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CONFIGURATION');
  } catch {
    return { ok: false, message: 'You do not have permission to update configurations.' };
  }

  const parsed = validateUpdateGlobalConfigurationEnabled({ id, enabled });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid configuration payload.'
    };
  }

  try {
    const data = await updateGlobalConfigurationEnabled(parsed.data);
    revalidatePath(LIST_PATH);
    revalidatePath('/', 'layout');
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update configuration status.');
  }
}

export async function updateGlobalConfigurationValuesAction(input: {
  id: number;
  value?: string;
  stringValue?: string;
  dateValue?: string;
}): Promise<GlobalConfigurationsActionResult<FineractGlobalConfigurationUpdateResponse>> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CONFIGURATION');
  } catch {
    return { ok: false, message: 'You do not have permission to update configurations.' };
  }

  const parsed = validateUpdateGlobalConfigurationValues({
    id: input.id,
    value: input.value?.trim() ? Number(input.value) : undefined,
    stringValue: input.stringValue?.trim() || undefined,
    dateValue: normalizeFineractDateField(input.dateValue),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid configuration payload.'
    };
  }

  if (parsed.data.value != null && !Number.isFinite(parsed.data.value)) {
    return { ok: false, message: 'Number value must be a valid integer.' };
  }

  try {
    const existing = await getGlobalConfiguration(parsed.data.id);
    if (
      existing &&
      parsed.data.stringValue != null &&
      !isKnownGlobalConfigurationStringValue(existing.name, parsed.data.stringValue)
    ) {
      return { ok: false, message: 'Select a valid option for this configuration.' };
    }

    const data = await updateGlobalConfigurationValues(parsed.data);
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update configuration values.');
  }
}
