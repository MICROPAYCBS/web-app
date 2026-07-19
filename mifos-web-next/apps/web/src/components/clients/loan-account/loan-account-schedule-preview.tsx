'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import {
  LoanRepaymentScheduleExportActions,
  LoanRepaymentSchedulePrintable
} from '@/components/clients/loan-account/schedule';
import {
  installmentAmount,
  scheduleCurrencyCode,
  scheduleHighlights
} from '@/components/clients/loan-account/schedule/loan-schedule-format';
import {
  loanScheduleHasOverduePeriods,
  loanScheduleOverdueAmountClassName,
  loanScheduleOverdueDueDateClassName,
  loanScheduleOverdueRowClassName,
  loanSchedulePeriodOverdueFlags,
  loanScheduleOverdueInstallmentCount,
  loanScheduleTotalOverdueAmount
} from '@/components/clients/loan-account/schedule/loan-schedule-overdue';
import { DetailSection } from '@/components/composites';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { useBusinessDate } from '@/components/platform/business-date-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function installmentPeriods(schedule: LoanScheduleData) {
  return (schedule.periods ?? []).filter((row) => (row.period ?? 0) > 0);
}

function SummaryCard({
  label,
  amount,
  currencyCode,
  className
}: {
  label: string;
  amount?: number;
  currencyCode: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border p-3', className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <MoneyValue amount={amount} currencyCode={currencyCode} className="text-sm font-medium" />
    </div>
  );
}

function ScheduleSummary({
  schedule,
  layout
}: {
  schedule: LoanScheduleData;
  layout: 'section' | 'page';
}) {
  const businessDate = useBusinessDate();
  const referenceDate =
    businessDate.date?.trim() || format(new Date(), FINERACT_DATE_FORMAT);
  const currencyCode = scheduleCurrencyCode(schedule);
  const highlights = scheduleHighlights(schedule);
  const periods = schedule.periods ?? [];
  const overdueInstallmentCount = loanScheduleOverdueInstallmentCount(periods, referenceDate);
  const totalOverdue = loanScheduleTotalOverdueAmount(periods, referenceDate);
  const gridClass =
    layout === 'page'
      ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'
      : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <>
      <div className={cn('mb-4', gridClass)}>
        <SummaryCard
          label="Principal disbursed"
          amount={schedule.totalPrincipalDisbursed}
          currencyCode={currencyCode}
        />
        <SummaryCard
          label="Expected principal"
          amount={schedule.totalPrincipalExpected}
          currencyCode={currencyCode}
        />
        <SummaryCard
          label="Total interest"
          amount={schedule.totalInterestCharged}
          currencyCode={currencyCode}
        />
        <SummaryCard
          label="Total fees"
          amount={schedule.totalFeeChargesCharged}
          currencyCode={currencyCode}
        />
        {layout === 'page' ? (
          <>
            <SummaryCard
              label="Total repayment"
              amount={schedule.totalRepaymentExpected}
              currencyCode={currencyCode}
              className="sm:col-span-2 lg:col-span-1"
            />
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Loan term</p>
              <p className="text-sm font-medium">
                {schedule.loanTermInDays != null ? `${schedule.loanTermInDays} days` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Installments</p>
              <p className="text-sm font-medium">{highlights.installmentCount || '—'}</p>
            </div>
          </>
        ) : (
          <SummaryCard
            label="Total repayment"
            amount={schedule.totalRepaymentExpected}
            currencyCode={currencyCode}
          />
        )}
      </div>

      {layout === 'page' ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">First repayment</p>
            <p className="text-sm font-medium">{highlights.firstRepaymentDate ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Last repayment</p>
            <p className="text-sm font-medium">{highlights.lastRepaymentDate ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Average installment</p>
            <MoneyValue
              amount={highlights.averageInstallment}
              currencyCode={currencyCode}
              className="text-sm font-medium"
            />
          </div>
          <div
            className={cn(
              'rounded-lg border border-border p-3',
              overdueInstallmentCount > 0 && 'border-destructive/25 bg-destructive/[0.03]'
            )}
          >
            <p className="text-xs text-muted-foreground">Overdue installments</p>
            {overdueInstallmentCount > 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive/85">
                  {overdueInstallmentCount} of {highlights.installmentCount || '—'}
                </p>
                <MoneyValue
                  amount={totalOverdue}
                  currencyCode={currencyCode}
                  className="text-sm font-medium text-destructive/85"
                />
              </div>
            ) : (
              <p className="text-sm font-medium">None</p>
            )}
          </div>
        </div>
      ) : schedule.loanTermInDays != null ? (
        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
          <p>
            Loan term: {schedule.loanTermInDays} days · {highlights.installmentCount} installments
          </p>
          {overdueInstallmentCount > 0 ? (
            <p>
              {overdueInstallmentCount} overdue installment
              {overdueInstallmentCount === 1 ? '' : 's'} ·{' '}
              <MoneyValue
                amount={totalOverdue}
                currencyCode={currencyCode}
                className="inline text-destructive/85"
              />
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function ScheduleTable({
  schedule,
  layout
}: {
  schedule: LoanScheduleData;
  layout: 'section' | 'page';
}) {
  const businessDate = useBusinessDate();
  const referenceDate =
    businessDate.date?.trim() || format(new Date(), FINERACT_DATE_FORMAT);
  const currencyCode = scheduleCurrencyCode(schedule);
  const periods = schedule.periods ?? [];
  const showExtendedColumns = layout === 'page';
  const hasOverduePeriods = loanScheduleHasOverduePeriods(periods, referenceDate);

  return (
    <>
      {hasOverduePeriods ? (
        <p className="mb-3 text-xs text-muted-foreground print:hidden">
          Overdue installments are highlighted along the left edge; overdue amounts use a muted
          accent.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border print:overflow-visible print:rounded-none print:border-slate-300">
        <Table className="print:text-xs">
          <TableHeader>
            <TableRow className="print:bg-slate-100">
              <TableHead>#</TableHead>
              <TableHead>Due date</TableHead>
              {showExtendedColumns ? <TableHead className="text-right">Days</TableHead> : null}
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead className="text-right">Installment</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((row, index) => {
              const isDisbursement = row.period === 0;
              const overdue = loanSchedulePeriodOverdueFlags(row, referenceDate);
              return (
                <TableRow
                  key={`schedule-period-${row.period ?? index}`}
                  className={cn(
                    isDisbursement && 'bg-muted/40',
                    loanScheduleOverdueRowClassName(overdue.period)
                  )}
                >
                  <TableCell>{row.period ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(loanScheduleOverdueDueDateClassName(overdue.period))}>
                        {row.dueDate ?? '—'}
                      </span>
                      {overdue.period ? (
                        <Badge
                          variant="outline"
                          className="border-destructive/25 text-destructive/80 print:hidden"
                        >
                          Overdue
                        </Badge>
                      ) : null}
                      {isDisbursement ? (
                        <Badge variant="secondary" className="print:hidden">
                          Disbursement
                        </Badge>
                      ) : null}
                      {row.downPaymentPeriod ? (
                        <Badge variant="outline" className="print:hidden">
                          Down payment
                        </Badge>
                      ) : null}
                      {isDisbursement ? (
                        <span className="hidden text-xs text-muted-foreground print:inline">
                          Disbursement
                        </span>
                      ) : null}
                      {row.downPaymentPeriod ? (
                        <span className="hidden text-xs text-muted-foreground print:inline">
                          Down payment
                        </span>
                      ) : null}
                      {overdue.period ? (
                        <span className="hidden text-xs text-destructive/80 print:inline">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  {showExtendedColumns ? (
                    <TableCell className="text-right">{row.daysInPeriod ?? '—'}</TableCell>
                  ) : null}
                  <TableCell
                    className={cn(
                      'text-right',
                      loanScheduleOverdueAmountClassName(overdue.principal)
                    )}
                  >
                    {isDisbursement ? (
                      '—'
                    ) : (
                      <MoneyValue amount={row.principalDue} currencyCode={currencyCode} />
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      loanScheduleOverdueAmountClassName(overdue.interest)
                    )}
                  >
                    {isDisbursement ? (
                      '—'
                    ) : (
                      <MoneyValue amount={row.interestDue} currencyCode={currencyCode} />
                    )}
                  </TableCell>
                  <TableCell
                    className={cn('text-right', loanScheduleOverdueAmountClassName(overdue.fees))}
                  >
                    <MoneyValue amount={row.feeChargesDue} currencyCode={currencyCode} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      loanScheduleOverdueAmountClassName(overdue.installment)
                    )}
                  >
                    {isDisbursement ? (
                      row.principalDisbursed != null ? (
                        <MoneyValue amount={row.principalDisbursed} currencyCode={currencyCode} />
                      ) : (
                        '—'
                      )
                    ) : (
                      <MoneyValue amount={installmentAmount(row)} currencyCode={currencyCode} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyValue
                      amount={row.principalLoanBalanceOutstanding}
                      currencyCode={currencyCode}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ScheduleAlerts({
  stale,
  error,
  fieldErrors,
  staleMessage
}: {
  stale?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
  staleMessage: string;
}) {
  return (
    <div className="print:hidden">
      {stale ? (
        <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          {staleMessage}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {fieldErrors && Object.keys(fieldErrors).length > 0 && !error ? (
        <ul className="mb-4 space-y-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {Object.values(fieldErrors).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RecalculateButton({
  loading,
  onRecalculate
}: {
  loading?: boolean;
  onRecalculate?: () => void;
}) {
  if (!onRecalculate) {
    return null;
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRecalculate}>
      <RefreshCw className={cn('mr-1 size-4', loading && 'animate-spin')} />
      Recalculate
    </Button>
  );
}

export function LoanAccountSchedulePreview({
  schedule,
  loading = false,
  stale = false,
  error,
  fieldErrors,
  canPreview = true,
  layout = 'section',
  idleMessage = 'Complete loan terms to preview the repayment schedule.',
  staleMessage = 'Terms changed since the last preview — recalculate before submitting.',
  onRecalculate,
  exportContext
}: {
  schedule: LoanScheduleData | null;
  loading?: boolean;
  stale?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
  canPreview?: boolean;
  layout?: 'section' | 'page';
  idleMessage?: string;
  staleMessage?: string;
  onRecalculate?: () => void;
  exportContext?: {
    account: FineractLoanAccountDetail;
    reportOrgName?: string | null;
  };
}) {
  const content = (
    <>
      <ScheduleAlerts
        stale={stale}
        error={error}
        fieldErrors={fieldErrors}
        staleMessage={staleMessage}
      />
      {!schedule && !loading ? (
        <p className="text-sm text-muted-foreground print:hidden">{idleMessage}</p>
      ) : null}
      {schedule ? (
        exportContext ? (
          <LoanRepaymentSchedulePrintable
            account={exportContext.account}
            schedule={schedule}
            reportOrgName={exportContext.reportOrgName}
          >
            <ScheduleSummary schedule={schedule} layout={layout} />
            <ScheduleTable schedule={schedule} layout={layout} />
          </LoanRepaymentSchedulePrintable>
        ) : (
          <>
            <ScheduleSummary schedule={schedule} layout={layout} />
            <ScheduleTable schedule={schedule} layout={layout} />
          </>
        )
      ) : null}
      {loading && !schedule ? (
        <p className="text-sm text-muted-foreground print:hidden">
          {canPreview ? 'Calculating repayment schedule…' : idleMessage}
        </p>
      ) : null}
    </>
  );

  const exportActions =
    exportContext && schedule ? (
      <LoanRepaymentScheduleExportActions
        account={exportContext.account}
        schedule={schedule}
        reportOrgName={exportContext.reportOrgName}
      />
    ) : null;

  if (layout === 'page') {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h2 className="text-lg font-semibold tracking-tight">Repayment schedule</h2>
          <div className="flex flex-wrap items-center gap-2">
            {exportActions}
            <RecalculateButton loading={loading} onRecalculate={onRecalculate} />
          </div>
        </div>
        {content}
      </section>
    );
  }

  return (
    <DetailSection
      title="Repayment schedule"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {exportActions}
          <RecalculateButton loading={loading} onRecalculate={onRecalculate} />
        </div>
      }
    >
      {content}
    </DetailSection>
  );
}
