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
import {
  formatGlAccountEnquiryAmountOnly,
  glAccountEnquiryBalanceNatureLabel,
  glAccountEnquiryBalanceScopeLabel
} from '@/lib/accounting/gl-account-enquiry-display';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import { GL_ACCOUNT_ENQUIRY_SUMMARY_FETCH_LIMIT } from '@/lib/fineract/gl-account-enquiry-query';

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

export function GlAccountEnquirySummaryPanel({
  summary,
  currencyCode,
  glAccountTypeId,
  periodLabel,
  accountHeading
}: {
  summary: GlAccountEnquirySummary | null;
  currencyCode?: string;
  glAccountTypeId?: number;
  periodLabel: string;
  accountHeading?: string;
}) {
  if (!summary) {
    return null;
  }

  const balanceNature = glAccountEnquiryBalanceNatureLabel(glAccountTypeId);
  const balanceScope = glAccountEnquiryBalanceScopeLabel(summary);

  return (
    <div className="space-y-3">
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
          description={`${summary.entryCount.toLocaleString()} entries`}
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
