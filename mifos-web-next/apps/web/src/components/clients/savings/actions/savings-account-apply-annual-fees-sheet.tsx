'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  executeSavingsAccountPayChargeAction,
  loadSavingsAccountAnnualFeeSheetDataAction
} from '@/actions/savings-account-command';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';
import { dateToFineract } from '@/lib/fineract/date-input';

export function SavingsAccountApplyAnnualFeesSheet({
  clientId,
  accountId,
  currencyCode,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [chargeId, setChargeId] = useState<number | null>(null);
  const [chargeName, setChargeName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => dateToFineract(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setDueDate(dateToFineract(new Date()));
    void loadSavingsAccountAnnualFeeSheetDataAction(String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setChargeId(null);
        return;
      }
      setChargeId(result.chargeId);
      setChargeName(result.chargeName);
      setAmount(result.amount != null ? String(result.amount) : '');
    });
    return () => {
      cancelled = true;
    };
  }, [open, accountId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (chargeId == null) {
      return;
    }
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountPayChargeAction(clientId, String(accountId), {
        chargeId,
        dueDate,
        amount: amount || undefined
      });

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
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
      title="Apply annual fee"
      description="Post the annual fee charge for this account."
      formId={formId}
      submitLabel="Apply fee"
      submitLoading={pending}
      submitDisabled={loading || chargeId == null}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading annual fee…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {chargeName ? (
            <TextField
              id={`${formId}-charge-name`}
              label="Charge"
              value={chargeName}
              onChange={() => undefined}
              disabled
            />
          ) : null}
          {amount ? (
            <TextField
              id={`${formId}-amount`}
              label={`Amount (${currencyCode})`}
              value={amount}
              onChange={() => undefined}
              disabled
            />
          ) : null}
          <DateField
            id={`${formId}-due-date`}
            label="Due date"
            value={dueDate}
            onChange={setDueDate}
            error={fieldErrors.dueDate}
            required
            disabled={pending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}
