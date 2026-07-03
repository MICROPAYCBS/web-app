/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function portfolioAccountStatusVariant(
  code?: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed') || code.includes('reject') || code.includes('withdrawn')) {
    return 'destructive';
  }
  if (code.includes('pending') || code.includes('submitted') || code.includes('approved')) {
    return 'outline';
  }
  return 'secondary';
}

export function formatPortfolioAccountBalance(
  amount: number | undefined,
  currencyCode?: string
): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  return formatAccountMoney(amount, currencyCode);
}
