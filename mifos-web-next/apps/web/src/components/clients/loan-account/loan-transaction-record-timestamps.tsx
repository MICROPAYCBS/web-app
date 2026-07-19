'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLoanAccountTransaction } from '@/lib/fineract/loan-account-types';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { formatFineractDateTimeArray } from '@/lib/fineract/dates';
import { loanTransactionDate } from '@/lib/fineract/loan-account-display';

export function LoanTransactionRecordTimestamps({
  transaction
}: {
  transaction: FineractLoanAccountTransaction;
}) {
  const createdAt = formatFineractDateTimeArray(transaction.createdDate);
  const submittedOn = formatFineractDateTimeArray(transaction.submittedOnDate);
  const businessDate = formatFineractDateTimeArray(loanTransactionDate(transaction));

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
