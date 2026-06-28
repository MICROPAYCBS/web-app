'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { format, subMonths } from 'date-fns';
import { Download, Loader2, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SavingsStatementDocument } from '@/components/clients/savings/statement/savings-statement-document';
import {
  buildSavingsStatementDocumentData,
  savingsStatementFileName,
  type SavingsStatementDocumentData
} from '@/components/clients/savings/statement/savings-statement-view-model';
import { DateField } from '@/components/composites/date-field';
import { DetailSection } from '@/components/composites';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { dateToFineract, fineractDateToDate } from '@/lib/fineract/date-input';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { savingsAccountCurrencyCode } from '@/lib/fineract/savings-account-display';
import { buildSavingsStatement } from '@/lib/fineract/savings-statement';
import { cn } from '@/lib/utils';

function defaultFromDate(endDateValue: string): string {
  const endDate = fineractDateToDate(endDateValue);
  if (!endDate) {
    return endDateValue;
  }
  return dateToFineract(subMonths(endDate, 1)) ?? endDateValue;
}

function formatPeriodLabel(fromDate: Date, toDate: Date): string {
  return `${format(fromDate, FINERACT_DATE_FORMAT)} to ${format(toDate, FINERACT_DATE_FORMAT)}`;
}

export function SavingsStatementSection({ account }: { account: FineractSavingsAccountDetail }) {
  const endDateDefault = useInitialTransactionDate();
  const [fromDateValue, setFromDateValue] = useState(() => defaultFromDate(endDateDefault));
  const [toDateValue, setToDateValue] = useState(endDateDefault);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statementData, setStatementData] = useState<SavingsStatementDocumentData | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [recordCount, setRecordCount] = useState(0);

  const currencyCode = savingsAccountCurrencyCode(account);
  const toDateLimit = fineractDateToDate(toDateValue);

  const canGenerate = useMemo(() => {
    const from = fineractDateToDate(fromDateValue);
    const to = fineractDateToDate(toDateValue);
    return Boolean(from && to && from.getTime() <= to.getTime());
  }, [fromDateValue, toDateValue]);

  function handleGenerate() {
    const fromDate = fineractDateToDate(fromDateValue);
    const toDate = fineractDateToDate(toDateValue);
    if (!fromDate || !toDate) {
      toast.error('Choose a valid statement period.');
      return;
    }
    if (fromDate.getTime() > toDate.getTime()) {
      toast.error('The from date must be on or before the to date.');
      return;
    }

    setGenerating(true);
    window.setTimeout(() => {
      const statement = buildSavingsStatement(account.transactions ?? [], fromDate, toDate);
      const documentData = buildSavingsStatementDocumentData({
        account,
        currencyCode,
        fromDate,
        toDate,
        statement
      });

      setStatementData(documentData);
      setRecordCount(statement.transactions.length);
      setPeriodLabel(formatPeriodLabel(fromDate, toDate));
      setHasGenerated(true);
      setGenerating(false);

      if (statement.transactions.length === 0) {
        toast.info('No transactions found for the selected period.');
      } else {
        toast.success(`Found ${statement.transactions.length} transactions.`);
      }
    }, 200);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <DetailSection title="Statement period" description="Select a date range to generate the statement.">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <DateField
            id="savings-statement-from"
            label="From date"
            value={fromDateValue}
            onChange={(value) => value && setFromDateValue(value)}
            toDate={toDateLimit}
            required
          />
          <DateField
            id="savings-statement-to"
            label="To date"
            value={toDateValue}
            onChange={(value) => value && setToDateValue(value)}
            toDate={toDateLimit}
            required
          />
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="lg:mb-0.5"
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="mr-2 size-4" aria-hidden />
            )}
            Generate
          </Button>
        </div>
      </DetailSection>

      {hasGenerated && statementData ? (
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2 print:hidden">
            <div className="space-y-1">
              <CardTitle className="text-base">Statement preview</CardTitle>
              <CardDescription>
                {recordCount} record{recordCount === 1 ? '' : 's'} from {periodLabel}
              </CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 size-4" aria-hidden />
                Print
              </Button>
              <PDFDownloadLink
                document={<SavingsStatementDocument data={statementData} />}
                fileName={savingsStatementFileName(
                  account.accountNo,
                  fineractDateToDate(toDateValue) ?? new Date()
                )}
              >
                {({ loading }) => (
                  <Button type="button" size="sm" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    ) : (
                      <Download className="mr-2 size-4" aria-hidden />
                    )}
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </CardHeader>

          <CardContent className="p-0 print:p-0">
            <div className="mb-2 flex flex-wrap justify-between gap-3 border-b bg-muted/30 px-4 py-2 text-sm">
              <span>
                Opening balance:{' '}
                <strong className="tabular-nums">{statementData.openingBalanceLabel}</strong>
              </span>
              <span>
                Closing balance:{' '}
                <strong className="tabular-nums">{statementData.closingBalanceLabel}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/50 bg-muted/50 font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Ref #</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {statementData.rows.length > 0 ? (
                    statementData.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{row.dateLabel}</td>
                        <td className="px-4 py-3">{row.description}</td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums">{row.id}</td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-mono font-medium tabular-nums',
                            row.tone === 'credit' && 'text-success',
                            row.tone === 'debit' && 'text-destructive'
                          )}
                        >
                          {row.amountLabel}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                          {row.balanceLabel}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No transactions found in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
