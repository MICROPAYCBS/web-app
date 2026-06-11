'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpdateOrganizationCurrencies,
  type UpdateOrganizationCurrenciesInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateOrganizationCurrencies } from '@/lib/fineract/organization-currencies';
import {
  ORGANIZATION_CURRENCIES_PATH,
  organizationCurrenciesManagePath
} from '@/lib/fineract/organization-currency-paths';
import { getServerSession } from '@/lib/session/server';

export type OrganizationCurrencyActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateCurrencyViews() {
  revalidatePath(ORGANIZATION_CURRENCIES_PATH);
  revalidatePath(organizationCurrenciesManagePath());
}

export async function updateOrganizationCurrenciesAction(
  input: UpdateOrganizationCurrenciesInput
): Promise<OrganizationCurrencyActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CURRENCY');
  } catch {
    return { ok: false, message: 'You do not have permission to update currencies.' };
  }

  const parsed = validateUpdateOrganizationCurrencies(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateOrganizationCurrencies(parsed.data);
    revalidateCurrencyViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update currencies.');
  }
}
