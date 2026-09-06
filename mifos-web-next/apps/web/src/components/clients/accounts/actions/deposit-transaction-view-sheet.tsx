'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { PaymentDetailSummary } from '@/components/composites/payment-detail-summary';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import { Badge } from '@/components/ui/badge';
import {
  formatSavingsAccountDate,
  formatSavingsTransactionType,
  isSavingsTransactionAccrual,
  isSavingsTransactionDebit,
  savingsTransactionCurrencyCode,
  savingsTransactionDate
} from '@/lib/fineract/savings-account-display';
import { cn } from '@/lib/utils';

export function DepositTransactionViewSheet({
  transaction,
  accountCurrencyCode,
  open,
  onOpenChange
}: {
  transaction: FineractSavingsAccountTransaction | null;
  accountCurrencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!transaction) {
    return null;
  }

  const currency =
    savingsTransactionCurrencyCode(transaction) ?? accountCurrencyCode;
  const debit = isSavingsTransactionDebit(transaction);
  const status = transaction.reversed
    ? 'Reversed'
    : transaction.transfer
      ? 'Transfer'
      : isSavingsTransactionAccrual(transaction)
        ? 'Accrual'
        : 'Posted';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(DOCKED_SHEET_LAYOUT_CLASSNAME, 'data-[side=right]:sm:max-w-lg')}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{formatSavingsTransactionType(transaction)}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">Transaction #{transaction.id}</span>
            <Badge variant="outline">{status}</Badge>
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <DetailSection title="Transaction">
            <DetailFieldGrid>
              <DetailField label="Id">{transaction.id}</DetailField>
              <DetailField label="Type">{formatSavingsTransactionType(transaction)}</DetailField>
              <DetailField label="Transaction date">
                {formatSavingsAccountDate(savingsTransactionDate(transaction))}
              </DetailField>
              {transaction.externalId?.trim() ? (
                <DetailField label="External ID">{transaction.externalId}</DetailField>
              ) : null}
              <DetailField label="Currency">
                {transaction.currency?.name ?? currency}
              </DetailField>
              <DetailField label="Debit">
                {debit ? (
                  <MoneyValue amount={transaction.amount} currencyCode={currency} emphasize />
                ) : (
                  '—'
                )}
              </DetailField>
              <DetailField label="Credit">
                {!debit ? (
                  <MoneyValue amount={transaction.amount} currencyCode={currency} emphasize />
                ) : (
                  '—'
                )}
              </DetailField>
              {transaction.runningBalance !== undefined ? (
                <DetailField label="Balance after">
                  <MoneyValue amount={transaction.runningBalance} currencyCode={currency} />
                </DetailField>
              ) : null}
              {transaction.submittedByUsername?.trim() ? (
                <DetailField label="Submitted by">{transaction.submittedByUsername}</DetailField>
              ) : null}
              {transaction.note?.trim() ? (
                <DetailField label="Note">{transaction.note}</DetailField>
              ) : null}
            </DetailFieldGrid>
          </DetailSection>
          {transaction.paymentDetailData ? (
            <PaymentDetailSummary payment={transaction.paymentDetailData} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
