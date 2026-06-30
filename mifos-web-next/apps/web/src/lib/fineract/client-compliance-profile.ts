/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientComplianceProfile, FineractCommandProcessingResult } from '@mifos/api-client';
import type { ComplianceProfileInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { normalizeClientComplianceProfile } from '@/lib/fineract/compliance-profile-normalize';
import { createFineractClient } from '@/lib/fineract/create-client';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

function toComplianceProfileBody(input: ComplianceProfileInput): Record<string, unknown> {
  if (!input.hasOtherBankAccounts) {
    const { otherBankAccounts: _ignored, ...rest } = input;
    return stripEmpty({
      ...rest,
      hasOtherBankAccounts: false,
      locale: input.locale ?? FINERACT_LOCALE
    });
  }

  const otherBankAccounts = input.otherBankAccounts
    ?.filter((account) => account.bankName.trim() && account.accountNumber.trim())
    .map((account, index) =>
      stripEmpty({
        ...account,
        displayOrder: index + 1
      })
    );

  return stripEmpty({
    ...input,
    otherBankAccounts: otherBankAccounts?.length ? otherBankAccounts : undefined,
    locale: input.locale ?? FINERACT_LOCALE
  });
}

export async function getClientComplianceProfile(
  clientId: string | number
): Promise<FineractClientComplianceProfile | null> {
  const fineract = await createFineractClient();
  try {
    const data = await fineract.get<unknown>(`/clients/${clientId}/complianceprofile`);
    return normalizeClientComplianceProfile(data);
  } catch {
    return null;
  }
}

export async function updateClientComplianceProfile(
  clientId: string | number,
  input: ComplianceProfileInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/clients/${clientId}/complianceprofile`, toComplianceProfileBody(input));
}
