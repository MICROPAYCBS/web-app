'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID,
  formatActionErrorMessage
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  calculateDepositAccountPrematureAmountAction,
  executeDepositAccountLifecycleCommandAction
} from '@/actions/deposit-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { Button } from '@/components/ui/button';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { depositLifecycleCommandToast } from '@/lib/fineract/deposit-account-command-toasts';
import type { DepositAccountClosureTemplate } from '@/lib/fineract/deposit-account-commands';
import {
  depositAccountKindLabel,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function DepositAccountPrematureCloseSheet({
  kind,
  clientId,
  accountId,
  currencyCode,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: number;
  currencyCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [calculating, setCalculating] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();
  const [closedOnDate, setClosedOnDate] = useState(initialTransactionDate);
  const [onAccountClosureId, setOnAccountClosureId] = useState('');
  const [toSavingsAccountId, setToSavingsAccountId] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [note, setNote] = useState('');
  const [template, setTemplate] = useState<DepositAccountClosureTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const label = depositAccountKindLabel(kind);
  const isFixed = kind === 'fixedDeposit';
  const transferSelected =
    Number(onAccountClosureId) === DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID;
  const canSubmit = !isFixed || Boolean(template);

  useEffect(() => {
    if (!open) {
      return;
    }
    setClosedOnDate(initialTransactionDate);
    setOnAccountClosureId('');
    setToSavingsAccountId('');
    setTransferDescription('');
    setNote('');
    setError(null);
    setFieldErrors({});
    setTemplate(null);
  }, [open, initialTransactionDate]);

  function handleCalculate() {
    setError(null);
    setFieldErrors({});
    setCalculating(true);
    void calculateDepositAccountPrematureAmountAction(kind, String(accountId), {
      closedOnDate
    }).then((result) => {
      setCalculating(false);
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setTemplate(result.data);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeDepositAccountLifecycleCommandAction(
        kind,
        clientId,
        String(accountId),
        'prematureClose',
        {
          closedOnDate,
          onAccountClosureId:
            isFixed && onAccountClosureId ? Number(onAccountClosureId) : undefined,
          toSavingsAccountId:
            transferSelected && toSavingsAccountId ? Number(toSavingsAccountId) : undefined,
          transferDescription: transferSelected ? transferDescription : undefined,
          note: note.trim() || undefined
        }
      );
      if (!toastCommandOutcome(result, depositLifecycleCommandToast(kind, 'prematureClose'))) {
        if (!result.ok) {
          setError(formatActionErrorMessage(result.message, result.fieldErrors));
          setFieldErrors(result.fieldErrors ?? {});
        }
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Premature close ${label}`}
      description={
        isFixed
          ? 'Choose a close date, calculate the premature amount, then confirm how to dispose of the proceeds.'
          : 'Close this account before maturity. Confirm the close date to continue.'
      }
      formId={formId}
      submitLabel="Premature close"
      submitLoading={pending || calculating}
      submitDisabled={!canSubmit}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TransactionDateField
          id={`${formId}-closed-on`}
          label="Closed on"
          value={closedOnDate}
          onChange={(value) => {
            setClosedOnDate(value);
            if (isFixed) {
              setTemplate(null);
            }
          }}
          error={fieldErrors.closedOnDate}
          required
        />

        {isFixed ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={calculating || !closedOnDate}
              onClick={handleCalculate}
            >
              {calculating ? 'Calculating…' : 'Calculate amount'}
            </Button>
            {template?.maturityAmount != null ? (
              <p className="text-sm text-muted-foreground">
                Premature amount:{' '}
                <span className="font-medium text-foreground">
                  {formatAccountMoney(template.maturityAmount, currencyCode)}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {isFixed && template ? (
          <>
            <SelectField
              label="On account closure"
              value={onAccountClosureId}
              onValueChange={(value) => setOnAccountClosureId(value ?? '')}
              options={(template.onAccountClosureOptions ?? []).map((option) => ({
                value: String(option.id),
                label: option.value ?? String(option.id)
              }))}
              placeholder="Select option"
              error={fieldErrors.onAccountClosureId}
              required
            />
            {transferSelected ? (
              <>
                <SelectField
                  label="Transfer to savings"
                  value={toSavingsAccountId}
                  onValueChange={(value) => setToSavingsAccountId(value ?? '')}
                  options={(template.savingsAccounts ?? []).map((account) => ({
                    value: String(account.id),
                    label: [account.accountNo, account.productName].filter(Boolean).join(' — ')
                  }))}
                  placeholder="Select savings account"
                  error={fieldErrors.toSavingsAccountId}
                  required
                />
                <TextField
                  id={`${formId}-transfer-description`}
                  label="Transfer description"
                  value={transferDescription}
                  onChange={setTransferDescription}
                  error={fieldErrors.transferDescription}
                />
              </>
            ) : null}
            <TextField
              id={`${formId}-note`}
              label="Note"
              value={note}
              onChange={setNote}
              error={fieldErrors.note}
              multiline
            />
          </>
        ) : null}

        {!isFixed ? (
          <TextField
            id={`${formId}-note`}
            label="Note"
            value={note}
            onChange={setNote}
            error={fieldErrors.note}
            multiline
          />
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
