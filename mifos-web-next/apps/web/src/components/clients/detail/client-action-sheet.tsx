'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useEffect, useId, useState, useTransition } from 'react';
import { executeClientActionCommand } from '@/actions/client-lifecycle-command';
import { loadClientActionSheetDataAction } from '@/actions/client-action-sheet-data';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { ClientActionSheetData, ClientActionSheetId } from '@/lib/clients/client-action-types';
import { CLIENT_ACTION_SHEET_TITLES } from '@/lib/clients/client-actions-menu-config';
import { dateToFineract } from '@/lib/fineract/date-input';
import { toSelectOptions } from '@/lib/form/select-options';

type FormState = {
  activationDate?: string;
  closureDate?: string;
  closureReasonId?: string;
  withdrawalDate?: string;
  withdrawalReasonId?: string;
  rejectionDate?: string;
  rejectionReasonId?: string;
  reactivationDate?: string;
  reopenedDate?: string;
  destinationOfficeId?: string;
  transferDate?: string;
  staffId?: string;
  savingsAccountId?: string;
  note?: string;
};

function defaultFormState(
  sheetId: ClientActionSheetId,
  data: ClientActionSheetData | null
): FormState {
  const today = dateToFineract(new Date());
  const base: FormState = {
    activationDate: today,
    closureDate: today,
    withdrawalDate: today,
    rejectionDate: today,
    reactivationDate: today,
    reopenedDate: today,
    transferDate: today
  };

  if (data?.sheetId === 'update-default-savings' && data.currentAccountId) {
    base.savingsAccountId = String(data.currentAccountId);
  }

  return base;
}

export function ClientActionSheet({
  clientId,
  sheetId,
  open,
  onOpenChange,
  onSuccess,
  hasProfileImage = true
}: {
  clientId: string;
  sheetId: ClientActionSheetId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  hasProfileImage?: boolean;
}) {
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [sheetData, setSheetData] = useState<ClientActionSheetData | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !sheetId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    void loadClientActionSheetDataAction(clientId, sheetId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setSheetData(null);
        return;
      }
      setSheetData(result.data);
      setForm(defaultFormState(sheetId, result.data));
    });
    return () => {
      cancelled = true;
    };
  }, [open, sheetId, clientId]);

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (!next) {
      setSheetData(null);
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  function buildPayload(): Record<string, unknown> {
    if (!sheetId) {
      return {};
    }
    switch (sheetId) {
      case 'activate':
        return { activationDate: form.activationDate };
      case 'close':
        return {
          closureDate: form.closureDate,
          closureReasonId: form.closureReasonId
        };
      case 'withdraw':
        return {
          withdrawalDate: form.withdrawalDate,
          withdrawalReasonId: form.withdrawalReasonId
        };
      case 'reject':
        return {
          rejectionDate: form.rejectionDate,
          rejectionReasonId: form.rejectionReasonId
        };
      case 'reactivate':
        return { reactivationDate: form.reactivationDate };
      case 'undo-rejection':
        return { reopenedDate: form.reopenedDate };
      case 'transfer':
        return {
          destinationOfficeId: form.destinationOfficeId,
          transferDate: form.transferDate,
          note: form.note
        };
      case 'accept-transfer':
      case 'reject-transfer':
      case 'undo-transfer':
        return { note: form.note };
      case 'assign-staff':
        return { staffId: form.staffId };
      case 'update-default-savings':
        return { savingsAccountId: form.savingsAccountId };
      default: {
        const _exhaustive: never = sheetId;
        return _exhaustive;
      }
    }
  }

  function handleSubmit() {
    if (!sheetId || loading) {
      return;
    }
    if (sheetId === 'activate' && !hasProfileImage) {
      setError('Upload a customer photo before activating this customer.');
      return;
    }
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeClientActionCommand(clientId, sheetId, buildPayload());
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      handleOpenChange(false);
      onSuccess();
    });
  }

  const title = sheetId ? CLIENT_ACTION_SHEET_TITLES[sheetId] : '';
  const reasonOptions =
    sheetData &&
    (sheetData.sheetId === 'close' ||
      sheetData.sheetId === 'reject' ||
      sheetData.sheetId === 'withdraw')
      ? toSelectOptions(sheetData.reasons.map((r) => ({ id: r.id, name: r.name })))
      : [];

  const officeOptions =
    sheetData?.sheetId === 'transfer'
      ? toSelectOptions(sheetData.offices.map((o) => ({ id: o.id, name: o.name })))
      : [];

  const staffOptions =
    sheetData?.sheetId === 'assign-staff'
      ? toSelectOptions(
          sheetData.staffOptions.map((s) => ({ id: s.id, name: s.name }))
        )
      : [];

  const savingsOptions =
    sheetData?.sheetId === 'update-default-savings'
      ? toSelectOptions(
          sheetData.accounts.map((a) => ({ id: a.id, name: a.name }))
        )
      : [];

  const transferProposalLabel =
    sheetData &&
    (sheetData.sheetId === 'accept-transfer' ||
      sheetData.sheetId === 'reject-transfer' ||
      sheetData.sheetId === 'undo-transfer')
      ? sheetData.transferDate
      : null;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      formId={formId}
      submitLabel="Confirm"
      submitLoading={pending}
      submitDisabled={
        loading ||
        !sheetId ||
        (sheetId === 'update-default-savings' && savingsOptions.length === 0) ||
        (sheetId === 'transfer' && officeOptions.length === 0)
      }
      onSubmit={handleSubmit}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
      {sheetId === 'activate' ? (
        <>
          {!hasProfileImage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              A customer photo is required before activation. Upload a photo from the profile
              avatar, then try again.
            </p>
          ) : null}
          <DateField
            id={`${formId}-activationDate`}
            label="Activation date"
            required
            value={form.activationDate}
            onChange={(d) => patchForm({ activationDate: d })}
            error={fieldErrors.activationDate}
          />
          {sheetData?.sheetId === 'activate' && sheetData.savingsProductName ? (
            <p className="text-sm text-muted-foreground">
              Savings product on activation:{' '}
              <span className="text-foreground">{sheetData.savingsProductName}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {sheetId === 'close' ? (
        <div className="flex flex-col gap-4">
          <DateField
            id={`${formId}-closureDate`}
            label="Closure date"
            required
            value={form.closureDate}
            onChange={(d) => patchForm({ closureDate: d })}
            error={fieldErrors.closureDate}
          />
          <SelectField
            id={`${formId}-closureReasonId`}
            label="Closure reason"
            required
            value={form.closureReasonId}
            onValueChange={(v) => patchForm({ closureReasonId: v })}
            options={reasonOptions}
            placeholder="Select reason"
            error={fieldErrors.closureReasonId}
          />
        </div>
      ) : null}

      {sheetId === 'withdraw' ? (
        <div className="flex flex-col gap-4">
          <DateField
            id={`${formId}-withdrawalDate`}
            label="Withdrawal date"
            required
            value={form.withdrawalDate}
            onChange={(d) => patchForm({ withdrawalDate: d })}
            error={fieldErrors.withdrawalDate}
          />
          <SelectField
            id={`${formId}-withdrawalReasonId`}
            label="Withdrawal reason"
            required
            value={form.withdrawalReasonId}
            onValueChange={(v) => patchForm({ withdrawalReasonId: v })}
            options={reasonOptions}
            placeholder="Select reason"
            error={fieldErrors.withdrawalReasonId}
          />
        </div>
      ) : null}

      {sheetId === 'reject' ? (
        <div className="flex flex-col gap-4">
          <DateField
            id={`${formId}-rejectionDate`}
            label="Rejection date"
            required
            value={form.rejectionDate}
            onChange={(d) => patchForm({ rejectionDate: d })}
            error={fieldErrors.rejectionDate}
          />
          <SelectField
            id={`${formId}-rejectionReasonId`}
            label="Rejection reason"
            required
            value={form.rejectionReasonId}
            onValueChange={(v) => patchForm({ rejectionReasonId: v })}
            options={reasonOptions}
            placeholder="Select reason"
            error={fieldErrors.rejectionReasonId}
          />
        </div>
      ) : null}

      {sheetId === 'reactivate' ? (
        <DateField
          id={`${formId}-reactivationDate`}
          label="Reactivation date"
          required
          value={form.reactivationDate}
          onChange={(d) => patchForm({ reactivationDate: d })}
          error={fieldErrors.reactivationDate}
        />
      ) : null}

      {sheetId === 'undo-rejection' ? (
        <DateField
          id={`${formId}-reopenedDate`}
          label="Reopened date"
          required
          value={form.reopenedDate}
          onChange={(d) => patchForm({ reopenedDate: d })}
          error={fieldErrors.reopenedDate}
        />
      ) : null}

      {sheetId === 'transfer' ? (
        <div className="flex flex-col gap-4">
          {officeOptions.length === 0 && !loading && !error ? (
            <p className="text-sm text-muted-foreground">
              No other branches are available to transfer this customer to.
            </p>
          ) : null}
          <SelectField
            id={`${formId}-destinationOfficeId`}
            label="Destination branch"
            required
            value={form.destinationOfficeId}
            onValueChange={(v) => patchForm({ destinationOfficeId: v })}
            options={officeOptions}
            placeholder="Select branch"
            error={fieldErrors.destinationOfficeId}
            disabled={officeOptions.length === 0}
          />
          <DateField
            id={`${formId}-transferDate`}
            label="Transfer date"
            required
            value={form.transferDate}
            onChange={(d) => patchForm({ transferDate: d })}
            error={fieldErrors.transferDate}
          />
          <TextField
            id={`${formId}-note`}
            label="Note"
            optional
            multiline
            rows={3}
            value={form.note ?? ''}
            onChange={(v) => patchForm({ note: v })}
          />
        </div>
      ) : null}

      {sheetId === 'accept-transfer' ||
      sheetId === 'reject-transfer' ||
      sheetId === 'undo-transfer' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Transfer date:{' '}
            <span className="text-foreground">{transferProposalLabel ?? '—'}</span>
          </p>
          <TextField
            id={`${formId}-note`}
            label="Note"
            optional
            multiline
            rows={3}
            value={form.note ?? ''}
            onChange={(v) => patchForm({ note: v })}
          />
        </div>
      ) : null}

      {sheetId === 'assign-staff' ? (
        <SelectField
          id={`${formId}-staffId`}
          label="Relationship officer"
          required
          value={form.staffId}
          onValueChange={(v) => patchForm({ staffId: v })}
          options={staffOptions}
          placeholder="Select relationship officer"
          error={fieldErrors.staffId}
        />
      ) : null}

      {sheetId === 'update-default-savings' ? (
        <>
          {savingsOptions.length === 0 && !loading && !error ? (
            <p className="text-sm text-muted-foreground">
              No open savings accounts are available for this customer. Create a savings account
              first, then try again.
            </p>
          ) : null}
          <SelectField
            id={`${formId}-savingsAccountId`}
            label="Default savings account"
            required
            value={form.savingsAccountId}
            onValueChange={(v) => patchForm({ savingsAccountId: v })}
            options={savingsOptions}
            placeholder="Select account"
            error={fieldErrors.savingsAccountId}
          />
        </>
      ) : null}
      </form>
    </FormSheet>
  );
}
