'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractBusinessDateUpdateResponse } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import { toFineractActionError, validateUpdateBusinessDate } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateBusinessDate } from '@/lib/fineract/business-date';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, normalizeFineractDateField } from '@/lib/fineract/dates';
import { getServerSession } from '@/lib/session/server';

const PAGE_PATH = '/system/business-date';

export type BusinessDateActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function updateBusinessDateAction(input: {
  type: 'BUSINESS_DATE' | 'COB_DATE';
  date: string;
}): Promise<BusinessDateActionResult<FineractBusinessDateUpdateResponse>> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('system.businessDate.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update business dates.' };
  }

  const parsed = validateUpdateBusinessDate({
    type: input.type,
    date: normalizeFineractDateField(input.date),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid business date payload.'
    };
  }

  if (!parsed.data.date) {
    return { ok: false, message: 'Date is required.' };
  }

  try {
    const data = await updateBusinessDate(parsed.data);
    revalidatePath(PAGE_PATH);
    revalidatePath('/', 'layout');
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update business date.');
  }
}
