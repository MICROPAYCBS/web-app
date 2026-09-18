'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useId, useMemo, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createLoanCollateralAction,
  loadLoanCollateralTemplateAction
} from '@/actions/loan-collateral';
import type { LoanAccountCollateralContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DetailSection, MoneyValue } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  loanAccountCurrencyCode
} from '@/lib/fineract/loan-account-display';
import type {
  FineractLoanAccountDetail,
  FineractLoanPledgedCollateral,
  LoanCollateralRecord,
  LoanCollateralTypeOption
} from '@/lib/fineract/loan-account-types';
import { formatActionErrorMessage } from '@mifos/validation';

export function LoanAccountCollateralSheet({
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
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LoanCollateralTypeOption[]>([]);
  const [collateralTypeId, setCollateralTypeId] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function reset() {
    setCollateralTypeId('');
    setValue('');
    setDescription('');
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadLoanCollateralTemplateAction(accountId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTypes(result.allowedCollateralTypes);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, open]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createLoanCollateralAction(clientId, accountId, {
        collateralTypeId: Number(collateralTypeId),
        value: Number(value),
        description
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
      title="Add collateral"
      description="Pledge property against this loan before it is approved."
      formId={formId}
      submitLabel="Add collateral"
      submitLoading={pending || loading}
      submitDisabled={pending || loading}
      onSubmit={handleSubmit}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <SelectField
          label="Collateral type"
          required
          value={collateralTypeId}
          onValueChange={(next) => setCollateralTypeId(next ?? '')}
          options={toSelectOptions(types)}
          error={fieldErrors.collateralTypeId}
          disabled={pending || loading}
        />
        <NumericField
          label="Value"
          required
          value={value}
          onChange={setValue}
          error={fieldErrors.value}
          disabled={pending || loading}
        />
        <TextField
          label="Description"
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          disabled={pending || loading}
        />
      </form>
    </FormSheet>
  );
}

export function LoanAccountCollateralSection({
  account,
  clientId,
  context,
  addOpen,
  onAddOpenChange
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  context: LoanAccountCollateralContext;
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = addOpen ?? internalOpen;
  const setOpen = onAddOpenChange ?? setInternalOpen;
  const currency = loanAccountCurrencyCode(account);
  const pledged = account.collateral ?? [];

  const columns = useMemo<ColumnDef<LoanCollateralRecord>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="tabular-nums">#{row.original.id}</span>
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => row.original.typeName ?? '—'
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description?.trim() || '—'
      },
      {
        id: 'value',
        header: () => <span className="block w-full text-right">Value</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            <MoneyValue
              amount={row.original.value}
              currencyCode={row.original.currencyCode ?? currency}
            />
          </span>
        )
      }
    ],
    [currency]
  );

  const table = useReactTable({
    data: context.items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const pledgedColumns = useMemo<ColumnDef<FineractLoanPledgedCollateral>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: ({ row }) =>
          row.original.id != null ? (
            <span className="tabular-nums">#{row.original.id}</span>
          ) : (
            '—'
          )
      },
      {
        id: 'quantity',
        header: () => <span className="block w-full text-right">Quantity</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            {row.original.quantity ?? '—'}
          </span>
        )
      },
      {
        id: 'total',
        header: () => <span className="block w-full text-right">Total</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            <MoneyValue amount={row.original.total} currencyCode={currency} />
          </span>
        )
      },
      {
        id: 'totalCollateral',
        header: () => <span className="block w-full text-right">Collateral value</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            <MoneyValue amount={row.original.totalCollateral} currencyCode={currency} />
          </span>
        )
      }
    ],
    [currency]
  );

  const pledgedTable = useReactTable({
    data: pledged,
    columns: pledgedColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DetailSection
      title="Collateral"
      actions={
        context.canCreate ? (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add collateral
          </Button>
        ) : undefined
      }
    >
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No collateral on this loan."
        emptyDescription="Add collateral before the loan is approved."
      />

      {pledged.length > 0 ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm font-medium">Pledged customer collateral</p>
          <DataTable table={pledgedTable} stickyHeader={false} />
        </div>
      ) : null}

      <LoanAccountCollateralSheet
        clientId={clientId}
        accountId={account.id}
        open={open}
        onOpenChange={setOpen}
      />
    </DetailSection>
  );
}
