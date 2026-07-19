'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';

function hasValue(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

export function PaymentDetailSummary({
  payment
}: {
  payment: NonNullable<FineractSavingsAccountTransaction['paymentDetailData']>;
}) {
  const rows = [
    { label: 'Account no.', value: payment.accountNumber },
    { label: 'Cheque number', value: payment.checkNumber },
    { label: 'Routing code', value: payment.routingCode },
    { label: 'Receipt no.', value: payment.receiptNumber },
    { label: 'Bank no.', value: payment.bankNumber }
  ].filter((row) => hasValue(row.value));

  if (!payment.paymentType?.name && rows.length === 0) {
    return null;
  }

  return (
    <DetailSection title="Payment detail">
      <DetailFieldGrid>
        {payment.paymentType?.name ? (
          <DetailField label="Payment type">{payment.paymentType.name}</DetailField>
        ) : null}
        {rows.map((row) => (
          <DetailField key={row.label} label={row.label}>
            {row.value}
          </DetailField>
        ))}
      </DetailFieldGrid>
    </DetailSection>
  );
}
