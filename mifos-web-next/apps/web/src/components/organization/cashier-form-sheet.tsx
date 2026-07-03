'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractStaffListItem, OrganizationCashierListItem } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { assignCashierAction, updateCashierAction } from '@/actions/cashier';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import {
  fineractApiDateToFormString,
  toFineractDate
} from '@/lib/fineract/dates';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { toSelectOptions } from '@/lib/form/select-options';

type CashierFormState = {
  staffId: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
};

function staffLabel(staff: FineractStaffListItem): string {
  const name = `${staff.firstname ?? ''} ${staff.lastname ?? ''}`.trim();
  return name || `Staff ${staff.id}`;
}

function defaultFormState(): CashierFormState {
  return {
    staffId: '',
    startDate: toFineractDate(),
    endDate: '',
    isFullDay: true
  };
}

function formStateFromCashier(cashier: OrganizationCashierListItem): CashierFormState {
  return {
    staffId: cashier.staffId ? String(cashier.staffId) : '',
    startDate: fineractApiDateToFormString(cashier.startDate) ?? toFineractDate(),
    endDate: fineractApiDateToFormString(cashier.endDate) ?? '',
    isFullDay: cashier.isFullDay ?? true
  };
}

export function CashierFormSheet({
  open,
  onOpenChange,
  mode,
  tellerId,
  staff,
  cashier
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'assign' | 'edit';
  tellerId: string | number;
  staff: FineractStaffListItem[];
  cashier?: OrganizationCashierListItem;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<CashierFormState>(() =>
    cashier ? formStateFromCashier(cashier) : defaultFormState()
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const staffOptions = useMemo(
    () =>
      toSelectOptions(
        staff.map((member) => ({
          id: member.id,
          name: staffLabel(member)
        }))
      ),
    [staff]
  );

  const startDateMin = useMemo(() => fineractDateToDate(form.startDate), [form.startDate]);

  const title = mode === 'assign' ? 'Assign cashier' : 'Edit cashier assignment';
  const description =
    mode === 'assign'
      ? 'Assign a staff member to work this teller window.'
      : 'Update the dates and schedule for this cashier assignment.';

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(cashier ? formStateFromCashier(cashier) : defaultFormState());
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        staffId: form.staffId,
        startDate: form.startDate,
        endDate: form.endDate,
        isFullDay: form.isFullDay
      };

      const result =
        mode === 'assign'
          ? await assignCashierAction(tellerId, payload)
          : cashier
            ? await updateCashierAction(tellerId, cashier.id, {
                staffId: form.staffId,
                startDate: form.startDate,
                endDate: form.endDate,
                isFullDay: form.isFullDay
              })
            : { ok: false as const, message: 'Cashier not found.' };

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'assign' ? 'Cashier assigned.' : 'Cashier assignment updated.', pending: mode === 'assign' ? 'Cashier assigned. sent for approval.' : 'Cashier assignment updated. sent for approval.' });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      formId={formId}
      submitLabel={mode === 'assign' ? 'Assign' : 'Save'}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4">

        {mode === 'assign' ? (
          <SelectField
            label="Staff member"
            required
            value={form.staffId}
            onValueChange={(value) => setForm((current) => ({ ...current, staffId: value ?? '' }))}
            options={staffOptions}
            error={fieldErrors.staffId}
            disabled={pending}
            placeholder="Select staff"
          />
        ) : cashier?.staffName ? (
          <Field>
            <FieldLabel>Staff member</FieldLabel>
            <p className="text-sm">{cashier.staffName}</p>
          </Field>
        ) : null}

        <DateField
          label="Start date"
          required
          allowFuture
          value={form.startDate}
          onChange={(value) => setForm((current) => ({ ...current, startDate: value ?? '' }))}
          error={fieldErrors.startDate}
          disabled={pending}
        />

        <DateField
          label="End date"
          required
          allowFuture
          fromDate={startDateMin ?? undefined}
          value={form.endDate}
          onChange={(value) => setForm((current) => ({ ...current, endDate: value ?? '' }))}
          error={fieldErrors.endDate}
          disabled={pending}
        />

        <Field>
          <FieldContent className="flex flex-row items-center gap-2">
            <Checkbox
              id={`${formId}-full-day`}
              checked={form.isFullDay}
              disabled={pending}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isFullDay: checked === true }))
              }
            />
            <FieldLabel htmlFor={`${formId}-full-day`} className="font-normal">
              Full day
            </FieldLabel>
          </FieldContent>
        </Field>
      </form>
    </FormSheet>
  );
}
