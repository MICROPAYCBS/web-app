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
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition, useEffect } from 'react';
import { editLoanTranchesAction } from '@/actions/loan-tranches';
import { DateField } from '@/components/composites/date-field';
import { DetailSection, MoneyValue } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { Button } from '@/components/ui/button';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import {
  formatLoanAccountDate,
  loanAccountCurrencyCode
} from '@/lib/fineract/loan-account-display';
import type {
  FineractLoanAccountDetail,
  FineractLoanAccountDisbursementDetail
} from '@/lib/fineract/loan-account-types';

type TrancheDraft = {
  key: string;
  id?: number;
  expectedDisbursementDate: string;
  principal: string;
};

function toDraft(row: FineractLoanAccountDisbursementDetail, index: number): TrancheDraft {
  return {
    key: row.id != null ? `id-${row.id}` : `new-${index}`,
    id: row.id,
    expectedDisbursementDate:
      fineractApiDateToFormString(row.expectedDisbursementDate) ?? '',
    principal: row.principal != null ? String(row.principal) : ''
  };
}

function LoanAccountTrancheRowSheet({
  open,
  onOpenChange,
  editing,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TrancheDraft | null;
  onSave: (row: TrancheDraft) => void;
}) {
  const formId = useId();
  const [expectedDisbursementDate, setExpectedDisbursementDate] = useState('');
  const [principal, setPrincipal] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setExpectedDisbursementDate(editing?.expectedDisbursementDate ?? '');
    setPrincipal(editing?.principal ?? '');
  }, [editing, open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    onSave({
      key: editing?.key ?? `new-${Date.now()}`,
      id: editing?.id,
      expectedDisbursementDate,
      principal
    });
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={editing?.id ? 'Edit tranche' : 'Add tranche'}
      description="Expected disbursement date and principal for this tranche."
      formId={formId}
      submitLabel={editing?.id ? 'Save tranche' : 'Add tranche'}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <DateField
          label="Expected disbursement date"
          required
          allowFuture
          value={expectedDisbursementDate}
          onChange={(value) => setExpectedDisbursementDate(value ?? '')}
        />
        <NumericField
          label="Principal"
          required
          value={principal}
          onChange={setPrincipal}
        />
      </form>
    </FormSheet>
  );
}

export function LoanAccountTranchesSection({
  account,
  clientId,
  canEdit
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<TrancheDraft[]>(() =>
    (account.disbursementDetails ?? []).map(toDraft)
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TrancheDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currency = loanAccountCurrencyCode(account);
  const dirty = JSON.stringify(rows) !== JSON.stringify((account.disbursementDetails ?? []).map(toDraft));

  const columns = useMemo<ColumnDef<TrancheDraft>[]>(
    () => [
      {
        id: 'expected',
        header: 'Expected date',
        cell: ({ row }) => formatLoanAccountDate(row.original.expectedDisbursementDate)
      },
      {
        id: 'actual',
        header: 'Disbursed date',
        cell: ({ row }) => {
          const source = account.disbursementDetails?.find((item) => item.id === row.original.id);
          return formatLoanAccountDate(source?.actualDisbursementDate);
        }
      },
      {
        id: 'principal',
        header: () => <span className="block w-full text-right">Principal</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            <MoneyValue amount={Number(row.original.principal)} currencyCode={currency} />
          </span>
        )
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(row.original);
                      setSheetOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRows((current) => current.filter((item) => item.key !== row.original.key))
                    }
                  >
                    Remove
                  </Button>
                </div>
              )
            } satisfies ColumnDef<TrancheDraft>
          ]
        : [])
    ],
    [account.disbursementDetails, canEdit, currency]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await editLoanTranchesAction(clientId, account.id, {
        disbursementData: rows.map((row) => ({
          id: row.id,
          expectedDisbursementDate: row.expectedDisbursementDate,
          principal: Number(row.principal)
        }))
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
      title="Tranches"
      actions={
        canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add tranche
            </Button>
            <Button type="button" size="sm" disabled={pending || !dirty} onClick={handleSave}>
              Save tranches
            </Button>
          </div>
        ) : undefined
      }
    >
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No planned disbursements."
        emptyDescription="Add expected tranche dates and amounts, then save."
      />
      <LoanAccountTrancheRowSheet
        open={sheetOpen}
        onOpenChange={(next) => {
          if (!next) {
            setEditing(null);
          }
          setSheetOpen(next);
        }}
        editing={editing}
        onSave={(row) => {
          setRows((current) => {
            const index = current.findIndex((item) => item.key === row.key);
            if (index >= 0) {
              const next = [...current];
              next[index] = row;
              return next;
            }
            return [...current, row];
          });
        }}
      />
    </DetailSection>
  );
}
