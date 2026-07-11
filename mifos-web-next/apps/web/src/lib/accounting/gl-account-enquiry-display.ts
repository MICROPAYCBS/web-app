/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountDetail } from '@mifos/api-client';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import { glAccountBalanceLabel } from '@/lib/accounting/gl-account-enquiry-summary';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function formatGlAccountEnquiryMoney(
  amount: number | null | undefined,
  currencyCode?: string
): string {
  return formatAccountMoney(amount ?? undefined, currencyCode);
}

export function formatGlAccountEnquiryAccountHeading(account: FineractGlAccountDetail | null) {
  if (!account) {
    return 'GL account';
  }
  const typeLabel = account.type?.value ?? account.type?.name;
  const label = formatGlAccountLabel(account);
  return typeLabel ? `${label} · ${typeLabel}` : label;
}

export function glAccountEnquiryBalanceScopeLabel(
  summary: Pick<GlAccountEnquirySummary, 'balanceScope'>
) {
  return summary.balanceScope === 'office' ? 'Branch balance' : 'Organization balance';
}

export function glAccountEnquiryBalanceNatureLabel(glAccountTypeId?: number) {
  return glAccountTypeId != null ? glAccountBalanceLabel(glAccountTypeId) : 'Balance';
}
