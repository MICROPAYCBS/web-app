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
  executeSavingsAccountLifecycleCommandAction,
  loadSavingsAccountBlockReasonsAction
} from '@/actions/savings-account-command';
import { CodeValueSelectField } from '@/components/composites/code-value-select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { SavingsAccountLifecycleCommand } from '@/lib/fineract/savings-account-command-meta';
import { SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES } from '@/lib/fineract/savings-account-command-meta';

export type SavingsAccountBlockDialogKind = Extract<
  SavingsAccountLifecycleCommand,
  'block' | 'blockCredit' | 'blockDebit'
>;

const BLOCK_COPY: Record<
  SavingsAccountBlockDialogKind,
  { title: string; description: string; submitLabel: string }
> = {
  block: {
    title: 'Block account',
    description: 'Block all deposits and withdrawals on this account.',
    submitLabel: 'Block account'
  },
  blockCredit: {
    title: 'Block deposits',
    description: 'Prevent credit transactions on this account.',
    submitLabel: 'Block deposits'
  },
  blockDebit: {
    title: 'Block withdrawals',
    description: 'Prevent debit transactions on this account.',
    submitLabel: 'Block withdrawals'
  }
};

export function SavingsAccountBlockDialog({
  clientId,
  accountId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  kind: SavingsAccountBlockDialogKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<{ id: number; name: string }[]>([]);
  const [reasonCodeName, setReasonCodeName] = useState<string>(
    SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES.block
  );
  const [reasonId, setReasonId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !kind) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setReasonId('');
    setRemarks('');
    void loadSavingsAccountBlockReasonsAction(kind).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setReasons([]);
        setReasonCodeName(SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES[kind]);
        return;
      }
      setReasons(result.reasons);
      setReasonCodeName(result.codeName);
    });
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  if (!kind) {
    return null;
  }

  const copy = BLOCK_COPY[kind];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const selected = reasons.find((row) => String(row.id) === reasonId);
    if (!selected) {
      setFieldErrors({ reasonForBlock: 'Select a reason.' });
      return;
    }

    const reasonForBlock = remarks.trim()
      ? `${selected.name} - ${remarks.trim()}`
      : selected.name;

    startTransition(async () => {
      const result = await executeSavingsAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        kind as SavingsAccountBlockDialogKind,
        { reasonForBlock }
      );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading block reasons…</p>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            <CodeValueSelectField
              id={`${formId}-reason`}
              label="Reason"
              codeName={reasonCodeName}
              value={reasonId}
              onValueChange={(value) => setReasonId(value ?? '')}
              options={reasons.map((row) => ({ value: String(row.id), label: row.name }))}
              placeholder="Select a reason"
              error={fieldErrors.reasonForBlock}
              required
            />
            <TextField
              id={`${formId}-remarks`}
              label="Note"
              value={remarks}
              onChange={setRemarks}
              multiline
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="destructive"
            disabled={pending || loading}
          >
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
