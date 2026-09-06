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
  executeDepositAccountLifecycleCommandAction,
  loadDepositAccountCloseTemplateAction
} from '@/actions/deposit-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { depositLifecycleCommandToast } from '@/lib/fineract/deposit-account-command-toasts';
import type { DepositAccountClosureTemplate } from '@/lib/fineract/deposit-account-commands';
import {
  depositAccountKindLabel,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function DepositAccountCloseSheet({
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
  const [loading, setLoading] = useState(false);
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
  const transferSelected =
    Number(onAccountClosureId) === DEPOSIT_ACCOUNT_CLOSURE_TRANSFER_TO_SAVINGS_ID;

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
    setLoading(true);
    void loadDepositAccountCloseTemplateAction(kind, String(accountId)).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTemplate(result.data);
    });
  }, [open, kind, accountId, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeDepositAccountLifecycleCommandAction(
        kind,
        clientId,
        String(accountId),
        'close',
        {
          closedOnDate,
          onAccountClosureId: onAccountClosureId ? Number(onAccountClosureId) : undefined,
          toSavingsAccountId:
            transferSelected && toSavingsAccountId ? Number(toSavingsAccountId) : undefined,
          transferDescription: transferSelected ? transferDescription : undefined,
          note: note.trim() || undefined
        }
      );
      if (!toastCommandOutcome(result, depositLifecycleCommandToast(kind, 'close'))) {
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
      title={`Close ${label}`}
      description="Close this matured account and choose how to dispose of the maturity proceeds."
      formId={formId}
      submitLabel="Close account"
      submitLoading={pending || loading}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {template?.maturityAmount != null ? (
          <p className="text-sm text-muted-foreground">
            Maturity amount:{' '}
            <span className="font-medium text-foreground">
              {formatAccountMoney(template.maturityAmount, currencyCode)}
            </span>
          </p>
        ) : null}
        <TransactionDateField
          id={`${formId}-closed-on`}
          label="Closed on"
          value={closedOnDate}
          onChange={setClosedOnDate}
          error={fieldErrors.closedOnDate}
          required
        />
        <SelectField
          label="On account closure"
          value={onAccountClosureId}
          onValueChange={(value) => setOnAccountClosureId(value ?? '')}
          options={(template?.onAccountClosureOptions ?? []).map((option) => ({
            value: String(option.id),
            label: option.value ?? String(option.id)
          }))}
          placeholder={loading ? 'Loading…' : 'Select option'}
          error={fieldErrors.onAccountClosureId}
          required
          disabled={loading}
        />
        {transferSelected ? (
          <>
            <SelectField
              label="Transfer to savings"
              value={toSavingsAccountId}
              onValueChange={(value) => setToSavingsAccountId(value ?? '')}
              options={(template?.savingsAccounts ?? []).map((account) => ({
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}
