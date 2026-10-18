'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { Decimal } from 'decimal.js';
import type { ReactNode } from 'react';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { formatLoanAccountDate } from '@/lib/fineract/loan-account-display';
import { futureInterest, type PeriodicAccrualPayoff } from '@/lib/fineract/periodic-accrual-payoff';

function QuoteRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function MoneyRow({
  label,
  amount,
  currencyCode
}: {
  label: string;
  amount?: number | Decimal;
  currencyCode: string;
}) {
  return (
    <QuoteRow label={label}>
      <MoneyValue amount={amount} currencyCode={currencyCode} />
    </QuoteRow>
  );
}

export function PeriodicAccrualPayoffQuote({
  payoff,
  currencyCode
}: {
  payoff: PeriodicAccrualPayoff;
  currencyCode: string;
}) {
  const accruedThrough =
    payoff.accruedTill == null ? 'Not yet accrued' : formatLoanAccountDate(payoff.accruedTill);
  const unearnedInterest = futureInterest(payoff);

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="font-medium">Payoff on {formatLoanAccountDate(payoff.asOfDate)}</p>
        {payoff.accrualPaused ? <p className="text-muted-foreground">Accrual is paused</p> : null}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <MoneyRow
          label="Payoff through maturity"
          amount={payoff.contractPayoff}
          currencyCode={currencyCode}
        />
        <MoneyRow
          label="Payoff of interest earned to date"
          amount={payoff.earnedPayoff}
          currencyCode={currencyCode}
        />
        <MoneyRow
          label="Interest earned, not yet in the books"
          amount={payoff.interestNotYetInBooks}
          currencyCode={currencyCode}
        />
        {unearnedInterest != null ? (
          <MoneyRow
            label="Future interest"
            amount={unearnedInterest}
            currencyCode={currencyCode}
          />
        ) : null}
        {payoff.interestBooked != null ? (
          <MoneyRow
            label="Total interest booked"
            amount={payoff.interestBooked}
            currencyCode={currencyCode}
          />
        ) : null}
      </dl>
      <dl className="grid gap-3 sm:grid-cols-2">
        <MoneyRow label="Principal" amount={payoff.principalOutstanding} currencyCode={currencyCode} />
        <MoneyRow
          label="Unpaid interest on the contract"
          amount={payoff.interestOnContractOutstanding}
          currencyCode={currencyCode}
        />
        <MoneyRow
          label="Unpaid interest earned to this date"
          amount={payoff.interestEarnedOutstanding}
          currencyCode={currencyCode}
        />
        <MoneyRow
          label="Unpaid interest already recognized"
          amount={payoff.interestPostedOutstanding}
          currencyCode={currencyCode}
        />
        <MoneyRow label="Fees" amount={payoff.feeChargesOutstanding} currencyCode={currencyCode} />
        <MoneyRow
          label="Penalties"
          amount={payoff.penaltyChargesOutstanding}
          currencyCode={currencyCode}
        />
        <QuoteRow label="Accrued through">{accruedThrough}</QuoteRow>
      </dl>
    </div>
  );
}
