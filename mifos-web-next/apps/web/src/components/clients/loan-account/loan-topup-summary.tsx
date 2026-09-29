'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadLoanTopupContextAction } from '@/actions/loan-topup';
import { DetailField, DetailFieldGrid, DetailSection, MoneyValue } from '@/components/composites';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { loanAccountCurrencyCode } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanTopupShowsNetDisbursal,
  type LoanTopupPayoff
} from '@/lib/fineract/loan-topup';

export function LoanAccountTopupSummary({ account }: { account: FineractLoanAccountDetail }) {
  const currency = loanAccountCurrencyCode(account);
  const disbursed = account.topupAmount != null;
  const closureId = account.closureLoanId != null && account.closureLoanId > 0 ? account.closureLoanId : undefined;
  const [payoff, setPayoff] = useState<LoanTopupPayoff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (disbursed || closureId == null) {
      return;
    }
    const date = fineractApiDateToFormString(account.timeline?.expectedDisbursementDate);
    if (!date) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadLoanTopupContextAction(closureId, date).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      setPayoff(result.ok ? result.context.payoff : null);
    });
    return () => {
      cancelled = true;
    };
  }, [account.timeline?.expectedDisbursementDate, closureId, disbursed]);

  const closedLabel = account.closureLoanAccountNo;
  const closedHref =
    account.clientId != null && closureId != null
      ? clientAccountGeneralPath(account.clientId, 'loan', closureId)
      : undefined;

  return (
    <DetailSection title="Top-up">
      <DetailFieldGrid>
        <DetailField label="Loan closed">
          {closedLabel && closedHref ? (
            <Link href={closedHref} className="font-medium text-primary hover:underline">
              {closedLabel}
            </Link>
          ) : (
            closedLabel || '—'
          )}
        </DetailField>
        <DetailField label="Applied to close it">
          {disbursed ? (
            <MoneyValue amount={account.topupAmount} currencyCode={currency} />
          ) : loading ? (
            <span className="text-muted-foreground">Calculating payoff…</span>
          ) : payoff ? (
            <span className="space-y-1">
              <MoneyValue amount={payoff.amount} currencyCode={currency} />
              <span className="block text-xs text-muted-foreground">
                Recalculated at approval and disbursement.
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Recalculated at approval and disbursement.
            </span>
          )}
        </DetailField>
        {loanTopupShowsNetDisbursal(account.status) && account.netDisbursalAmount != null ? (
          <DetailField label="Net disbursed">
            <MoneyValue amount={account.netDisbursalAmount} currencyCode={currency} />
          </DetailField>
        ) : null}
      </DetailFieldGrid>
    </DetailSection>
  );
}
