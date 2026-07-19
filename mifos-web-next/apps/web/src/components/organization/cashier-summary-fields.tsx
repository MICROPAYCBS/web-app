'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  OrganizationCashierListItem,
  OrganizationCashierSummary
} from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { formatCashierAssignmentPeriod } from '@/lib/fineract/cashier-display';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

function formatCashierSummaryAmount(
  amount: number | undefined,
  currencyCode: string
): string {
  if (amount == null) {
    return '—';
  }
  return formatMoney(amount, currencyCode, FINERACT_LOCALE) ?? String(amount);
}

export function CashierSummaryFields({
  summary,
  currencyCode,
  cashier,
  tellerName
}: {
  summary: OrganizationCashierSummary;
  currencyCode: string;
  cashier?: OrganizationCashierListItem;
  tellerName?: string;
}) {
  return (
    <DetailFieldGrid>
      <DetailField label="Teller">{tellerName ?? summary.tellerName ?? '—'}</DetailField>
      <DetailField label="Branch">{summary.officeName ?? '—'}</DetailField>
      {cashier ? (
        <>
          <DetailField label="Assignment period">
            {formatCashierAssignmentPeriod(cashier)}
          </DetailField>
          <DetailField label="Schedule">
            {cashier.isFullDay === false ? 'Partial day' : 'Full day'}
          </DetailField>
        </>
      ) : null}
      <DetailField label="Net cash">
        {formatCashierSummaryAmount(summary.netCash, currencyCode)}
      </DetailField>
      <DetailField label="Cash allocated">
        {formatCashierSummaryAmount(summary.sumCashAllocation, currencyCode)}
      </DetailField>
      <DetailField label="Inward cash">
        {formatCashierSummaryAmount(summary.sumInwardCash, currencyCode)}
      </DetailField>
      <DetailField label="Outward cash">
        {formatCashierSummaryAmount(summary.sumOutwardCash, currencyCode)}
      </DetailField>
      <DetailField label="Cash settled">
        {formatCashierSummaryAmount(summary.sumCashSettlement, currencyCode)}
      </DetailField>
      <DetailField label="Currency">{currencyCode}</DetailField>
    </DetailFieldGrid>
  );
}
