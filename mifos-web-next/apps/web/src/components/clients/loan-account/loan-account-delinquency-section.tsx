'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import {
  createLoanDelinquencyPauseAction,
  createLoanDelinquencyResumeAction
} from '@/actions/loan-delinquency-action';
import type { LoanAccountDelinquencyContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DateField } from '@/components/composites/date-field';
import { DetailSection, MoneyValue } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { Button } from '@/components/ui/button';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import {
  formatLoanAccountDate,
  loanAccountCurrencyCode
} from '@/lib/fineract/loan-account-display';
import type {
  FineractLoanAccountDetail,
  FineractLoanInstallmentDelinquency,
  LoanDelinquencyActionRecord,
  LoanDelinquencyTagRecord
} from '@/lib/fineract/loan-account-types';

function actionLabel(action?: string) {
  const value = action?.toLowerCase() ?? '';
  if (value === 'pause') {
    return 'Pause';
  }
  if (value === 'resume') {
    return 'Resume';
  }
  return action ?? '—';
}

export function LoanAccountDelinquencySection({
  account,
  clientId,
  context
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  context: LoanAccountDelinquencyContext;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = loanAccountCurrencyCode(account);
  const installments = account.delinquent?.installmentLevelDelinquency ?? [];
  const lastAction = context.actions[context.actions.length - 1];
  const lastIsPause = lastAction?.action?.toLowerCase() === 'pause';
  const businessDate = useInitialTransactionDate();

  const tagColumns = useMemo<ColumnDef<LoanDelinquencyTagRecord>[]>(
    () => [
      {
        id: 'classification',
        header: 'Classification',
        cell: ({ row }) => row.original.classification ?? '—'
      },
      {
        id: 'added',
        header: 'Added on',
        cell: ({ row }) => formatLoanAccountDate(row.original.addedOnDate)
      },
      {
        id: 'lifted',
        header: 'Lifted on',
        cell: ({ row }) => formatLoanAccountDate(row.original.liftedOnDate)
      }
    ],
    []
  );

  const actionColumns = useMemo<ColumnDef<LoanDelinquencyActionRecord>[]>(
    () => [
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => actionLabel(row.original.action)
      },
      {
        id: 'start',
        header: 'Start',
        cell: ({ row }) => formatLoanAccountDate(row.original.startDate)
      },
      {
        id: 'end',
        header: 'End',
        cell: ({ row }) => formatLoanAccountDate(row.original.endDate)
      }
    ],
    []
  );

  const installmentColumns = useMemo<ColumnDef<FineractLoanInstallmentDelinquency>[]>(
    () => [
      {
        id: 'classification',
        header: 'Classification',
        cell: ({ row }) => row.original.classification ?? '—'
      },
      {
        id: 'age',
        header: 'Minimum age (days)',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.minimumAgeDays ?? '—'}</span>
        )
      },
      {
        id: 'amount',
        header: () => <span className="block w-full text-right">Amount</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            <MoneyValue amount={row.original.amount} currencyCode={currency} />
          </span>
        )
      }
    ],
    [currency]
  );

  const tagTable = useReactTable({
    data: context.tags,
    columns: tagColumns,
    getCoreRowModel: getCoreRowModel()
  });
  const actionTable = useReactTable({
    data: context.actions,
    columns: actionColumns,
    getCoreRowModel: getCoreRowModel()
  });
  const installmentTable = useReactTable({
    data: installments,
    columns: installmentColumns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleResume() {
    setError(null);
    startTransition(async () => {
      const result = await createLoanDelinquencyResumeAction(clientId, account.id, {
        startDate: businessDate
      });
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      router.refresh();
    });
  }

  return (
    <DetailSection
      title="Delinquency"
      actions={
        context.canPause ? (
          lastIsPause ? (
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleResume}>
              Cancel pause
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => setPauseOpen(true)}>
              Pause delinquency
            </Button>
          )
        ) : undefined
      }
    >
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-medium">Tag history</p>
        <DataTable table={tagTable} stickyHeader={false} emptyMessage="No delinquency tags." />
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium">Actions</p>
        <DataTable table={actionTable} stickyHeader={false} emptyMessage="No delinquency actions." />
      </div>

      {installments.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium">Installment delinquency</p>
          <DataTable table={installmentTable} stickyHeader={false} />
        </div>
      ) : null}

      <LoanAccountDelinquencyPauseSheet
        clientId={clientId}
        accountId={account.id}
        open={pauseOpen}
        onOpenChange={setPauseOpen}
      />
    </DetailSection>
  );
}

function LoanAccountDelinquencyPauseSheet({
  clientId,
  accountId,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialDate = useInitialTransactionDate();
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleOpenChange(next: boolean) {
    if (next) {
      setStartDate(initialDate);
      setEndDate('');
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createLoanDelinquencyPauseAction(clientId, accountId, {
        startDate,
        endDate
      });
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Pause delinquency"
      description="Stop delinquency ageing between these dates."
      formId={formId}
      submitLabel="Pause"
      submitLoading={pending}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <DateField
          label="Start date"
          required
          allowFuture
          value={startDate}
          onChange={(value) => setStartDate(value ?? '')}
          error={fieldErrors.startDate}
          disabled={pending}
        />
        <DateField
          label="End date"
          required
          allowFuture
          value={endDate}
          onChange={(value) => setEndDate(value ?? '')}
          error={fieldErrors.endDate}
          disabled={pending}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
