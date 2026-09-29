'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MoneyValue } from '@/components/composites/detail/money-value';
import type { LoanTopupPayoff } from '@/lib/fineract/loan-topup';

export function LoanTopupQuoteBreakdown({
  currencyCode,
  payoff,
  cashToClient,
  cashLabel = 'Cash to client',
  estimate = false,
  appliedAmount,
  omittedInterestBased = false
}: {
  currencyCode: string;
  payoff?: LoanTopupPayoff | null;
  cashToClient?: number | null;
  cashLabel?: string;
  estimate?: boolean;
  /** Payoff transferred onto the loan being closed. Defaults to the quote. */
  appliedAmount?: number | null;
  omittedInterestBased?: boolean;
}) {
  const applied = appliedAmount ?? payoff?.amount;
  return (
    <div className="space-y-3">
      {estimate ? (
        <p className="text-sm text-muted-foreground">
          Estimate. Recalculated at approval and disbursement.
        </p>
      ) : null}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Payoff</dt>
          <dd className="font-medium">
            <MoneyValue amount={payoff?.amount} currencyCode={currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Principal</dt>
          <dd className="font-medium">
            <MoneyValue amount={payoff?.principalPortion} currencyCode={currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Interest</dt>
          <dd className="font-medium">
            <MoneyValue amount={payoff?.interestPortion} currencyCode={currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fees</dt>
          <dd className="font-medium">
            <MoneyValue amount={payoff?.feeChargesPortion} currencyCode={currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Penalties</dt>
          <dd className="font-medium">
            <MoneyValue amount={payoff?.penaltyChargesPortion} currencyCode={currencyCode} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount applied to close it</dt>
          <dd className="font-medium">
            <MoneyValue amount={applied} currencyCode={currencyCode} />
          </dd>
        </div>
        {cashToClient != null ? (
          <div>
            <dt className="text-muted-foreground">{cashLabel}</dt>
            <dd className="font-medium">
              <MoneyValue amount={cashToClient} currencyCode={currencyCode} />
            </dd>
          </div>
        ) : null}
      </dl>
      {omittedInterestBased ? (
        <p className="text-sm text-muted-foreground">
          This estimate does not include interest-based charges due at disbursement.
        </p>
      ) : null}
    </div>
  );
}
