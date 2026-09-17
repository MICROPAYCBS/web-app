'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { formatActionErrorMessage, LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE } from '@mifos/validation';
import { parseAmount } from '@mifos/domain';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  previewLoanVariableScheduleAction,
  resetLoanVariableScheduleAction,
  submitLoanVariableScheduleAction
} from '@/actions/loan-variable-installments';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { loanAccountCurrencyCode } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  buildVariableScheduleExceptions,
  canDeleteVariableInstallment,
  hasVariableScheduleChanges,
  loanVariableInstallmentAmountKind,
  loanVariableInstallmentAmountLabel,
  loanVariableInstallmentGapHint,
  toFineractFormDate,
  variableInstallmentDraftsFromSchedule,
  visibleVariableInstallmentDrafts,
  type VariableInstallmentDraft
} from '@/lib/fineract/loan-variable-installments-display';

const SUBMIT_TOAST = {
  completed: 'Repayment schedule updated.',
  pending: 'Repayment schedule submitted for approval.'
};

const RESET_TOAST = {
  completed: 'Original repayment schedule restored.',
  pending: 'Restore original schedule submitted for approval.'
};

function parseMoneyValue(value: string): number | undefined {
  const decimal = parseAmount(value);
  if (!decimal) {
    return undefined;
  }
  return decimal.toNumber();
}

export function LoanAccountVariableInstallmentsSheet({
  clientId,
  account,
  canReset,
  open,
  onOpenChange
}: {
  clientId: string;
  account: FineractLoanAccountDetail;
  canReset: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<VariableInstallmentDraft[]>([]);
  const [preview, setPreview] = useState<LoanScheduleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternFrom, setPatternFrom] = useState('');
  const [patternTo, setPatternTo] = useState('');
  const [patternAmount, setPatternAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const currencyCode = loanAccountCurrencyCode(account);
  const amountKind = loanVariableInstallmentAmountKind(account);
  const amountLabel = loanVariableInstallmentAmountLabel(amountKind);
  const gapHint = loanVariableInstallmentGapHint(account);
  const fromDate = fineractDateToDate(
    fineractApiDateToFormString(account.timeline?.expectedDisbursementDate)
  );
  const visible = useMemo(() => visibleVariableInstallmentDrafts(drafts), [drafts]);
  const changed = hasVariableScheduleChanges(drafts);
  const validated = preview != null;
  const periodOptions = useMemo(
    () =>
      visible
        .filter((row) => row.period != null)
        .map((row) => ({
          value: String(row.period),
          label: `Installment ${row.period} · ${row.dueDate}`
        })),
    [visible]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setDrafts(variableInstallmentDraftsFromSchedule(account.repaymentSchedule, amountKind));
    setPreview(null);
    setError(null);
    setPatternFrom('');
    setPatternTo('');
    setPatternAmount('');
    setNewDueDate('');
    setNewAmount('');
  }, [open, account.repaymentSchedule, amountKind]);

  function updateDraft(key: string, patch: Partial<VariableInstallmentDraft>) {
    setPreview(null);
    setDrafts((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function exceptionsPayload() {
    return {
      amountKind,
      ...buildVariableScheduleExceptions(drafts, amountKind)
    };
  }

  function handleApplyPattern() {
    const fromPeriod = Number(patternFrom);
    const toPeriod = Number(patternTo);
    const amount = parseMoneyValue(patternAmount);
    if (!Number.isFinite(fromPeriod) || !Number.isFinite(toPeriod) || amount == null) {
      setError('Choose a from/to installment and an amount.');
      return;
    }
    const start = Math.min(fromPeriod, toPeriod);
    const end = Math.max(fromPeriod, toPeriod);
    setError(null);
    setPreview(null);
    setDrafts((current) =>
      current.map((row) =>
        row.period != null && row.period >= start && row.period <= end && !row.deleted
          ? { ...row, amount }
          : row
      )
    );
  }

  function handleAddInstallment() {
    const dueDate = toFineractFormDate(newDueDate) ?? newDueDate;
    const amount = parseMoneyValue(newAmount);
    if (!dueDate || amount == null) {
      setError('Enter a due date and amount for the new installment.');
      return;
    }
    setError(null);
    setPreview(null);
    setDrafts((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        dueDate,
        amount,
        originalAmount: amount,
        isNew: true
      }
    ]);
    setNewDueDate('');
    setNewAmount('');
  }

  function handleValidate() {
    setError(null);
    if (!changed) {
      setError(LOAN_VARIABLE_SCHEDULE_CHANGE_REQUIRED_MESSAGE);
      return;
    }
    startTransition(async () => {
      const result = await previewLoanVariableScheduleAction(
        String(account.id),
        exceptionsPayload()
      );
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setPreview(null);
        return;
      }
      setPreview(result.schedule);
    });
  }

  function handleSubmit() {
    setError(null);
    if (!validated) {
      setError('Validate the schedule before submitting.');
      return;
    }
    startTransition(async () => {
      const result = await submitLoanVariableScheduleAction(
        clientId,
        String(account.id),
        exceptionsPayload()
      );
      if (!toastCommandOutcome(result, SUBMIT_TOAST)) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetLoanVariableScheduleAction(clientId, String(account.id));
      if (!toastCommandOutcome(result, RESET_TOAST)) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setResetOpen(false);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Edit installments"
        description="Change installment dates or amounts on this pending loan, then validate before saving."
        submitLabel="Save schedule"
        submitLoading={pending}
        submitDisabled={!validated || pending}
        onSubmit={handleSubmit}
        className="data-[side=right]:sm:max-w-4xl"
      >
        <div className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {gapHint ? <p className="text-sm text-muted-foreground">{gapHint}</p> : null}
          {validated ? (
            <p className="text-sm text-muted-foreground">
              Recalculated schedule looks valid. Save to apply it, or edit an installment to
              validate again.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>{amountLabel}</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => {
                  const changedRow =
                    row.isNew ||
                    row.dueDate !== row.originalDueDate ||
                    row.amount !== row.originalAmount;
                  return (
                    <TableRow key={row.key} className={changedRow ? 'bg-muted/40' : undefined}>
                      <TableCell className="align-middle tabular-nums">
                        {row.period ?? 'New'}
                      </TableCell>
                      <TableCell className="min-w-44">
                        <DateField
                          id={`${formId}-due-${row.key}`}
                          label="Due date"
                          hideLabel
                          required
                          allowFuture
                          fromDate={fromDate}
                          value={row.dueDate}
                          onChange={(value) =>
                            updateDraft(row.key, {
                              dueDate: toFineractFormDate(value) ?? value ?? ''
                            })
                          }
                          disabled={pending}
                        />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <MoneyField
                          id={`${formId}-amount-${row.key}`}
                          label={amountLabel}
                          hideLabel
                          required
                          currencyCode={currencyCode}
                          value={String(row.amount)}
                          onChange={(value) => {
                            const amount = parseMoneyValue(value);
                            if (amount != null) {
                              updateDraft(row.key, { amount });
                            }
                          }}
                          disabled={pending}
                        />
                      </TableCell>
                      <TableCell className="align-middle text-right tabular-nums">
                        {formatAccountMoney(row.interestDue, currencyCode)}
                      </TableCell>
                      <TableCell className="align-middle">
                        {canDeleteVariableInstallment(drafts, row.key) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove installment ${row.period ?? 'new'}`}
                            disabled={pending}
                            onClick={() => updateDraft(row.key, { deleted: true })}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {preview ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recalculated schedule</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Installment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(preview.periods ?? [])
                      .filter((row) => (row.period ?? 0) > 0)
                      .map((row, index) => (
                        <TableRow key={`preview-${row.period ?? index}`}>
                          <TableCell>{row.period}</TableCell>
                          <TableCell>{row.dueDate ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatAccountMoney(row.principalDue, currencyCode)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatAccountMoney(row.interestDue, currencyCode)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatAccountMoney(
                              row.totalDueForPeriod ?? row.totalInstallmentAmountForPeriod,
                              currencyCode
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
            <SelectField
              id={`${formId}-pattern-from`}
              label="From installment"
              value={patternFrom || undefined}
              onValueChange={(value) => setPatternFrom(value ?? '')}
              options={periodOptions}
              placeholder="From"
              disabled={pending}
            />
            <SelectField
              id={`${formId}-pattern-to`}
              label="To installment"
              value={patternTo || undefined}
              onValueChange={(value) => setPatternTo(value ?? '')}
              options={periodOptions}
              placeholder="To"
              disabled={pending}
            />
            <MoneyField
              id={`${formId}-pattern-amount`}
              label={amountLabel}
              currencyCode={currencyCode}
              value={patternAmount}
              onChange={setPatternAmount}
              disabled={pending}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={handleApplyPattern}
              >
                Apply to range
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
            <DateField
              id={`${formId}-new-date`}
              label="New installment date"
              allowFuture
              fromDate={fromDate}
              value={newDueDate}
              onChange={(value) => setNewDueDate(value ?? '')}
              disabled={pending}
            />
            <MoneyField
              id={`${formId}-new-amount`}
              label={amountLabel}
              currencyCode={currencyCode}
              value={newAmount}
              onChange={setNewAmount}
              disabled={pending}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={handleAddInstallment}
              >
                <Plus className="mr-1 size-4" aria-hidden />
                Add installment
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!changed || pending || validated}
              onClick={handleValidate}
            >
              Validate schedule
            </Button>
            {canReset ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setResetOpen(true)}
              >
                Restore original
              </Button>
            ) : null}
          </div>
        </div>
      </FormSheet>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore original schedule</DialogTitle>
            <DialogDescription>
              Remove installment changes on this loan and restore the original repayment schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleReset}>
              Restore schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
