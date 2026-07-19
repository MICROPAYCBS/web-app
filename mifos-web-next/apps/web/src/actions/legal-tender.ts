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
  actionSuccessFromFineractCommand,
  toFineractActionError,
  validateUpsertLegalTender
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createCurrencyLegalTender,
  deleteCurrencyLegalTender,
  updateCurrencyLegalTender
} from '@/lib/fineract/legal-tenders';
import {
  LEGAL_TENDER_HUB_PATH,
  legalTenderLegacyEditPath,
  legalTenderListPath
} from '@/lib/fineract/legal-tender-paths';
import { getServerSession } from '@/lib/session/server';

export type LegalTenderActionResult =
  | { ok: true; legalTenderId?: number }
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

function revalidateLegalTenderViews(currencyCode: string, legalTenderId?: string | number) {
  revalidatePath(LEGAL_TENDER_HUB_PATH);
  revalidatePath(legalTenderListPath(currencyCode));
  if (legalTenderId != null) {
    revalidatePath(legalTenderLegacyEditPath(currencyCode, legalTenderId));
  }
}

export async function createLegalTenderAction(
  currencyCode: string,
  input: unknown
): Promise<LegalTenderActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_LEGAL_TENDER');
  } catch {
    return { ok: false, message: 'You do not have permission to create legal tenders.' };
  }

  const parsed = validateUpsertLegalTender(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createCurrencyLegalTender(currencyCode, parsed.data);
    revalidateLegalTenderViews(currencyCode, response.resourceId);
    return actionSuccessFromFineractCommand(response, { legalTenderId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create legal tender.');
  }
}

export async function updateLegalTenderAction(
  currencyCode: string,
  legalTenderId: string | number,
  input: unknown
): Promise<LegalTenderActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_LEGAL_TENDER');
  } catch {
    return { ok: false, message: 'You do not have permission to update legal tenders.' };
  }

  const parsed = validateUpsertLegalTender(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateCurrencyLegalTender(currencyCode, legalTenderId, parsed.data);
    revalidateLegalTenderViews(currencyCode, legalTenderId);
    return actionSuccessFromFineractCommand(response, {
      legalTenderId: response.resourceId ?? Number(legalTenderId)
    });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update legal tender.');
  }
}

export async function deleteLegalTenderAction(
  currencyCode: string,
  legalTenderId: string | number
): Promise<LegalTenderActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_LEGAL_TENDER');
  } catch {
    return { ok: false, message: 'You do not have permission to delete legal tenders.' };
  }

  try {
    const response = await deleteCurrencyLegalTender(currencyCode, legalTenderId);
    revalidateLegalTenderViews(currencyCode);
    return actionSuccessFromFineractCommand(response, { legalTenderId: Number(legalTenderId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete legal tender.');
  }
}
