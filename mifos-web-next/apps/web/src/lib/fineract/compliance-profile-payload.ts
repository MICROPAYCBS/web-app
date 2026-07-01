/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ComplianceProfileInput, OtherBankAccountInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

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

/** Map validated bank rows to Fineract compliance-profile payload entries. */
export function buildOtherBankAccountsForApi(
  accounts: OtherBankAccountInput[] | undefined
): Record<string, unknown>[] | undefined {
  const mapped = accounts
    ?.filter((account) => account.bankName.trim() && account.accountNumber.trim())
    .map((account, index) =>
      stripEmpty({
        bankName: account.bankName,
        branchName: account.branchName,
        accountNumber: account.accountNumber,
        displayOrder: index + 1
      })
    );

  return mapped?.length ? mapped : undefined;
}

/** PUT /clients/{id}/complianceprofile request body. */
export function buildComplianceProfilePutBody(
  input: ComplianceProfileInput
): Record<string, unknown> {
  if (!input.hasOtherBankAccounts) {
    const { otherBankAccounts: _ignored, ...rest } = input;
    return stripEmpty({
      ...rest,
      hasOtherBankAccounts: false,
      locale: input.locale ?? FINERACT_LOCALE
    });
  }

  return stripEmpty({
    ...input,
    otherBankAccounts: buildOtherBankAccountsForApi(input.otherBankAccounts),
    locale: input.locale ?? FINERACT_LOCALE
  });
}
