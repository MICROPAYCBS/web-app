'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { FinancialStatementDocument } from '@/components/reports/financial-statement-document';
import { Button } from '@/components/ui/button';
import {
  financialStatementFileName,
  financialStatementToCsv,
  type FinancialStatement,
  type FinancialStatementLine
} from '@/lib/fineract/financial-statement';
import { cn } from '@/lib/utils';

const FINANCIAL_STATEMENT_PRINT_BODY_CLASS = 'financial-statement-print';

function beginFinancialStatementPrint() {
  document.body.classList.add(FINANCIAL_STATEMENT_PRINT_BODY_CLASS);
}

function downloadCsv(statement: FinancialStatement) {
  const blob = new Blob([financialStatementToCsv(statement)], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = financialStatementFileName(statement.slug, 'csv');
  link.click();
  URL.revokeObjectURL(url);
}

function lineClassName(kind: FinancialStatementLine['kind']): string {
  if (kind === 'section') {
    return 'bg-muted/50 font-semibold';
  }
  if (kind === 'total' || kind === 'surplus') {
    return 'border-t border-border font-semibold';
  }
  return '';
}

export function FinancialStatementPreview({ statement }: { statement: FinancialStatement }) {
  const hasLines = statement.lines.some((line) => line.kind === 'line');
  const debitCredit = statement.layout === 'debit-credit';
  const fileName = financialStatementFileName(statement.slug, 'pdf');

  useEffect(() => {
    const onBeforePrint = () => {
      beginFinancialStatementPrint();
    };
    const onAfterPrint = () => {
      document.body.classList.remove(FINANCIAL_STATEMENT_PRINT_BODY_CLASS);
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove(FINANCIAL_STATEMENT_PRINT_BODY_CLASS);
    };
  }, []);

  function handlePrint() {
    beginFinancialStatementPrint();
    window.print();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={handlePrint} disabled={!hasLines}>
          <Printer className="mr-2 size-4" aria-hidden />
          Print
        </Button>
        {hasLines ? (
          <PDFDownloadLink document={<FinancialStatementDocument statement={statement} />} fileName={fileName}>
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
        ) : (
          <Button type="button" size="sm" disabled>
            <Download className="mr-2 size-4" aria-hidden />
            Download PDF
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadCsv(statement)}
          disabled={!hasLines}
        >
          <Download className="mr-2 size-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      <div
        data-financial-statement-printable
        className="overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10 print:overflow-visible print:bg-white print:text-black print:ring-0"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-4 print:border-slate-300">
          <div>
            <p className="text-xl font-semibold tracking-tight">{statement.organisationName}</p>
            <p className="mt-1 text-sm font-medium uppercase tracking-wider text-muted-foreground print:text-slate-600">
              {statement.title}
            </p>
          </div>
          <div className="text-sm">
            {statement.periodLabel ? (
              <p>
                <span className="text-muted-foreground print:text-slate-600">Period </span>
                <span className="font-medium">{statement.periodLabel}</span>
              </p>
            ) : null}
            {statement.officeLabel ? (
              <p>
                <span className="text-muted-foreground print:text-slate-600">Branch </span>
                <span className="font-medium">{statement.officeLabel}</span>
              </p>
            ) : null}
          </div>
        </div>

        {hasLines ? (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground print:border-slate-300 print:bg-slate-100 print:text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Account</th>
                  {debitCredit ? (
                    <>
                      <th className="px-4 py-3 text-right font-medium">Debit</th>
                      <th className="px-4 py-3 text-right font-medium">Credit</th>
                    </>
                  ) : (
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {statement.lines.map((line) => (
                  <tr key={line.id} className={lineClassName(line.kind)}>
                    <td className={cn('px-4 py-2.5', line.kind === 'line' && 'pl-8')}>{line.label}</td>
                    {debitCredit ? (
                      <>
                        <td className="px-4 py-2.5 text-right tabular-nums">{line.debitLabel ?? ''}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{line.creditLabel ?? ''}</td>
                      </>
                    ) : (
                      <td className="px-4 py-2.5 text-right tabular-nums">{line.amountLabel ?? ''}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-10 text-center text-muted-foreground">
            No accounts were returned for these parameters.
          </p>
        )}

        {statement.imbalanceNote ? (
          <p className="border-t border-border px-4 py-3 text-muted-foreground print:border-slate-300">
            {statement.imbalanceNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
