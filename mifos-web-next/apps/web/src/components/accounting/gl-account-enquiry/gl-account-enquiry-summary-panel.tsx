'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatGlAccountEnquiryAmountOnly,
  glAccountEnquiryBalanceNatureLabel,
  glAccountEnquiryBalanceScopeLabel
} from '@/lib/accounting/gl-account-enquiry-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import { GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT } from '@/lib/fineract/gl-account-enquiry-query';
import { cn } from '@/lib/utils';

function SummaryStat({
  label,
  value,
  description
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-xl font-semibold tracking-tight tabular-nums">{value}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

export function GlAccountEnquirySummarySkeleton({
  accountHeading,
  currencyCode,
  periodLabel
}: {
  accountHeading?: string;
  currencyCode?: string;
  periodLabel?: string;
}) {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading account enquiry summary">
      {accountHeading || periodLabel ? (
        <div className="text-sm text-muted-foreground">
          {accountHeading ? <span className="font-medium text-foreground">{accountHeading}</span> : null}
          {accountHeading && currencyCode ? (
            <>
              <span className="mx-2 text-border">·</span>
              <span className="font-medium text-foreground">{currencyCode}</span>
            </>
          ) : null}
          {periodLabel ? (
            <>
              {(accountHeading || currencyCode) && <span className="mx-2 text-border">·</span>}
              <span>{periodLabel}</span>
            </>
          ) : (
            <Skeleton className="inline-block h-4 w-48" />
          )}
        </div>
      ) : (
        <Skeleton className="h-4 w-72" />
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="gap-0 py-0 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function GlAccountEnquirySummaryPanel({
  summary,
  currencyCode,
  glAccountTypeId,
  periodLabel,
  accountHeading,
  pending = false
}: {
  summary: GlAccountEnquirySummary | null;
  currencyCode?: string;
  glAccountTypeId?: number;
  periodLabel: string;
  accountHeading?: string;
  pending?: boolean;
}) {
  if (!summary) {
    return pending ? (
      <GlAccountEnquirySummarySkeleton
        accountHeading={accountHeading}
        currencyCode={currencyCode}
        periodLabel={periodLabel}
      />
    ) : null;
  }

  const balanceNature = glAccountEnquiryBalanceNatureLabel(glAccountTypeId);
  const balanceScope = glAccountEnquiryBalanceScopeLabel(summary);

  return (
    <div
      className={cn('space-y-3', pending && 'pointer-events-none opacity-60')}
      aria-busy={pending || undefined}
    >
      {accountHeading ? (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{accountHeading}</span>
          {currencyCode ? (
            <>
              <span className="mx-2 text-border">·</span>
              <span className="font-medium text-foreground">{currencyCode}</span>
            </>
          ) : null}
          <span className="mx-2 text-border">·</span>
          <span>{periodLabel}</span>
        </div>
      ) : null}

      {summary.truncated ? (
        <div
          className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Totals may be incomplete</p>
            <p className="text-muted-foreground">
              More than {GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT.toLocaleString()} entries match this
              search. Debit, credit, and balance figures are computed from the first{' '}
              {GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT.toLocaleString()} entries only.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryStat
          label="Opening balance"
          value={formatGlAccountEnquiryAmountOnly(summary.openingBalance)}
          description={`${balanceNature} · ${balanceScope}`}
        />
        <SummaryStat
          label="Total debits"
          value={formatGlAccountEnquiryAmountOnly(summary.totalDebits)}
        />
        <SummaryStat
          label="Total credits"
          value={formatGlAccountEnquiryAmountOnly(summary.totalCredits)}
        />
        <SummaryStat
          label="Net movement"
          value={formatGlAccountEnquiryAmountOnly(summary.netMovement)}
          description={balanceNature}
        />
        <SummaryStat
          label="Closing balance"
          value={formatGlAccountEnquiryAmountOnly(summary.closingBalance)}
          description={`${balanceNature} · ${balanceScope}`}
        />
        <SummaryStat
          label="Entries"
          value={summary.entryCount.toLocaleString()}
          description={summary.truncated ? 'Filtered total (summary capped)' : 'Matching filters'}
        />
      </div>
    </div>
  );
}
