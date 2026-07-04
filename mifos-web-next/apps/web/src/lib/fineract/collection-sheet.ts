import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollectionSheetData } from '@/lib/fineract/collection-sheet-sum';
import { sumCollectionSheetExpected } from '@/lib/fineract/collection-sheet-sum';
import { createFineractClient } from '@/lib/fineract/create-client';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

export type GenerateCollectionSheetInput = {
  officeId: number;
  staffId?: number;
  transactionDate: string;
};

export async function postGenerateCollectionSheet(
  input: GenerateCollectionSheetInput
): Promise<CollectionSheetData> {
  const fineract = await createFineractClient();
  const body: Record<string, string | number> = {
    officeId: input.officeId,
    transactionDate: input.transactionDate,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
  if (input.staffId != null) {
    body.staffId = input.staffId;
  }
  return fineract.post<CollectionSheetData>('/collectionsheet', body, {
    command: 'generateCollectionSheet'
  });
}

/** Best-effort generate for dashboard KPIs — returns null when unavailable. */
export async function generateCollectionSheet(input: {
  officeId: number;
  staffId?: number;
  transactionDate: string;
}): Promise<CollectionSheetData | null> {
  try {
    return await postGenerateCollectionSheet(input);
  } catch {
    return null;
  }
}

export async function fetchExpectedCollectionsToday(input: {
  officeId: number | null;
  transactionDate: string;
  currencyCode?: string | null;
}): Promise<{ amount: number | null; loanCount: number | null }> {
  if (input.officeId == null) {
    return { amount: null, loanCount: null };
  }

  const sheet = await generateCollectionSheet({
    officeId: input.officeId,
    transactionDate: input.transactionDate
  });
  if (!sheet) {
    return { amount: null, loanCount: null };
  }

  const { totalExpected, loanCount } = sumCollectionSheetExpected(sheet, input.currencyCode);
  return {
    amount: totalExpected,
    loanCount
  };
}
