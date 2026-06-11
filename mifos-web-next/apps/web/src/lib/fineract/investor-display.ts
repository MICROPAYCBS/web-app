/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { InvestorTransferItem } from '@mifos/api-client';
import { formatAmount, toDecimal } from '@mifos/domain';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export const INVESTOR_BUYBACK_PENDING_END_DATE = '9999-12-31';

export function formatInvestorAmount(value?: number): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  const decimal = toDecimal(value);
  if (!decimal) {
    return '—';
  }
  return formatAmount(decimal);
}

export function formatInvestorDate(value?: string | number[]): string {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'string') {
    const parsed = formatFineractDateArray(value);
    return parsed ?? value;
  }
  return formatFineractDateArray(value) ?? '—';
}

export function investorStatusLabel(status?: string): string {
  return status?.trim() || '—';
}

export function canCancelInvestorTransfer(item: InvestorTransferItem): boolean {
  return item.status === 'PENDING';
}

export function investorTransferKey(item: InvestorTransferItem, index: number): string {
  return String(item.transferId ?? item.transferExternalId ?? index);
}
