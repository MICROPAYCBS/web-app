'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { formatFineractDateTimeArray } from '@/lib/fineract/dates';
import { savingsTransactionDate } from '@/lib/fineract/savings-account-display';

export function savingsTransactionHasRecordTimestamps(
  transaction: FineractSavingsAccountTransaction
): boolean {
  return Boolean(
    transaction.createdDate ||
      transaction.submittedOnDate ||
      transaction.date ||
      transaction.submittedByUsername?.trim()
  );
}

export function SavingsTransactionRecordTimestamps({
  transaction
}: {
  transaction: FineractSavingsAccountTransaction;
}) {
  const createdAt = formatFineractDateTimeArray(transaction.createdDate);
  const submittedOn = formatFineractDateTimeArray(savingsTransactionDate(transaction));
  const businessDate = formatFineractDateTimeArray(transaction.date);

  const hasAny = createdAt || submittedOn || businessDate || transaction.submittedByUsername;

  if (!hasAny) {
    return null;
  }

  return (
    <DetailFieldGrid>
      {createdAt ? <DetailField label="Created at">{createdAt}</DetailField> : null}
      {submittedOn ? <DetailField label="Submitted on">{submittedOn}</DetailField> : null}
      {businessDate && businessDate !== submittedOn ? (
        <DetailField label="Business date">{businessDate}</DetailField>
      ) : null}
      {transaction.submittedByUsername ? (
        <DetailField label="Submitted by">{transaction.submittedByUsername}</DetailField>
      ) : null}
    </DetailFieldGrid>
  );
}
