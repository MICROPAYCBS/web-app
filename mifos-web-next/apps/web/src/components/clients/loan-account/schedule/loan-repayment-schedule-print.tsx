'use client';

import type { LoanScheduleData } from '@mifos/api-client';
import type { ReactNode } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { LoanRepaymentScheduleDocument } from '@/components/clients/loan-account/schedule/loan-repayment-schedule-document';
import {
  buildLoanRepaymentScheduleDocumentData,
  loanRepaymentScheduleFileName,
  resolveLoanScheduleOrgName
} from '@/components/clients/loan-account/schedule/loan-repayment-schedule-view-model';
import { Button } from '@/components/ui/button';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

const LOAN_SCHEDULE_PRINT_BODY_CLASS = 'loan-schedule-print';

function beginLoanSchedulePrint() {
  document.body.classList.add(LOAN_SCHEDULE_PRINT_BODY_CLASS);
  const cleanup = () => {
    document.body.classList.remove(LOAN_SCHEDULE_PRINT_BODY_CLASS);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
}

export function LoanRepaymentScheduleLetterhead({
  data
}: {
  data: ReturnType<typeof buildLoanRepaymentScheduleDocumentData>;
}) {
  return (
    <div className="border-b border-border pb-5 print:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold tracking-tight text-foreground print:text-black">
            {resolveLoanScheduleOrgName(data.orgName)}
          </p>
          <p className="mt-1 text-sm font-medium uppercase tracking-wider text-muted-foreground print:text-slate-600">
            Loan repayment schedule
          </p>
        </div>
        <p className="text-xs text-muted-foreground print:text-slate-500">
          Generated {data.generatedOnLabel}
        </p>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 print:text-black">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Customer</p>
          <p className="font-medium">{data.clientName}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Loan account</p>
          <p className="font-medium tabular-nums">{data.accountNo}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Product</p>
          <p className="font-medium">{data.productName}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Status</p>
          <p className="font-medium">{data.loanStatus}</p>
        </div>
        {data.officeName ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Branch</p>
            <p className="font-medium">{data.officeName}</p>
          </div>
        ) : null}
        {data.loanOfficerName ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Loan officer</p>
            <p className="font-medium">{data.loanOfficerName}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Currency</p>
          <p className="font-medium">{data.currencyCode}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Installments</p>
          <p className="font-medium">{data.installmentCountLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function LoanRepaymentScheduleExportActions({
  account,
  schedule,
  reportOrgName
}: {
  account: FineractLoanAccountDetail;
  schedule: LoanScheduleData;
  reportOrgName?: string | null;
}) {
  const documentData = useMemo(
    () =>
      buildLoanRepaymentScheduleDocumentData({
        account,
        schedule,
        orgName: reportOrgName
      }),
    [account, schedule, reportOrgName]
  );
  const fileName = useMemo(
    () => loanRepaymentScheduleFileName(account.accountNo),
    [account.accountNo]
  );

  function handlePrint() {
    beginLoanSchedulePrint();
    window.print();
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
      <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 size-4" aria-hidden />
        Print
      </Button>
      <PDFDownloadLink document={<LoanRepaymentScheduleDocument data={documentData} />} fileName={fileName}>
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
  );
}

export function LoanRepaymentSchedulePrintable({
  account,
  schedule,
  reportOrgName,
  children
}: {
  account: FineractLoanAccountDetail;
  schedule: LoanScheduleData;
  reportOrgName?: string | null;
  children: ReactNode;
}) {
  const documentData = useMemo(
    () =>
      buildLoanRepaymentScheduleDocumentData({
        account,
        schedule,
        orgName: reportOrgName
      }),
    [account, schedule, reportOrgName]
  );

  return (
    <div
      data-loan-schedule-printable
      className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-sm print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none sm:p-6"
    >
      <LoanRepaymentScheduleLetterhead data={documentData} />
      {children}
    </div>
  );
}
