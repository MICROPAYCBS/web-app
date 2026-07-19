/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatMoney } from '@mifos/domain';
import { Banknote, ChartPie, CheckCircle2, FileText, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DetailSection } from '@/components/composites';
import type { ClientFinancialSummary } from '@/lib/fineract/client-financial-summary';
import { cn } from '@/lib/utils';

function formatSummaryAmount(amount: number, currencyCode?: string): string {
  if (currencyCode) {
    return formatMoney(amount, currencyCode) ?? '—';
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatShareCount(count: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(count);
}

function SummaryRow({
  icon: Icon,
  iconClassName,
  label,
  value,
  groupStart
}: {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string;
  groupStart?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border py-3 last:border-b-0',
        groupStart && 'border-t border-border'
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted',
          iconClassName
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="shrink-0 text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function ClientFinancialSummarySection({
  summary
}: {
  summary: ClientFinancialSummary;
}) {
  const currencyCode = summary.currencyCode;
  const showShares = summary.activeShares > 0;

  return (
    <DetailSection title="Financial summary">
      <div className="divide-y divide-border">
        <SummaryRow
          icon={PiggyBank}
          iconClassName="text-primary"
          label="Savings balance"
          value={formatSummaryAmount(summary.savingsBalance, currencyCode)}
        />
        <SummaryRow
          icon={PiggyBank}
          iconClassName="text-primary"
          label="Active savings"
          value={String(summary.activeSavings)}
        />

        {showShares ? (
          <>
            <SummaryRow
              icon={ChartPie}
              iconClassName="text-primary"
              label="Approved shares"
              value={formatShareCount(summary.approvedShares)}
              groupStart
            />
            {summary.pendingShares > 0 ? (
              <SummaryRow
                icon={ChartPie}
                label="Pending for approval"
                value={formatShareCount(summary.pendingShares)}
              />
            ) : null}
          </>
        ) : null}

        <SummaryRow
          icon={Banknote}
          iconClassName="text-primary"
          label="Loan balance"
          value={formatSummaryAmount(summary.loanBalance, currencyCode)}
          groupStart={!showShares}
        />
        {summary.lastLoanAmount > 0 ? (
          <SummaryRow
            icon={Banknote}
            label="Last loan amount"
            value={formatSummaryAmount(
              summary.lastLoanAmount,
              summary.lastLoanCurrencyCode ?? currencyCode
            )}
          />
        ) : null}
        <SummaryRow icon={Wallet} label="Active loans" value={String(summary.activeLoans)} />
        <SummaryRow icon={FileText} label="Loans taken" value={String(summary.loansTaken)} />
        <SummaryRow icon={CheckCircle2} label="Closed loans" value={String(summary.closedLoans)} />
      </div>
    </DetailSection>
  );
}
