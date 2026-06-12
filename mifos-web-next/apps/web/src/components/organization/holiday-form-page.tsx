'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem, HolidayReschedulingTypeOption } from '@mifos/api-client';
import { HOLIDAY_RESCHEDULE_SPECIFIC_DATE } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { createHolidayAction, updateHolidayAction } from '@/actions/holidays';
import { DateField } from '@/components/composites/date-field';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { HolidayOfficePicker } from '@/components/organization/holiday-office-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  HOLIDAY_LIST_PATH,
  holidayDetailPath
} from '@/lib/fineract/holiday-paths';
import { toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';

type HolidayFormState = {
  name: string;
  fromDate: string;
  toDate: string;
  reschedulingType: string;
  repaymentsRescheduledTo: string;
  description: string;
  offices: number[];
};

function defaultFormState(): HolidayFormState {
  return {
    name: '',
    fromDate: '',
    toDate: '',
    reschedulingType: '',
    repaymentsRescheduledTo: '',
    description: '',
    offices: []
  };
}

export function HolidayFormPage({
  mode,
  holidayId,
  isActive = false,
  reschedulingTypes,
  offices,
  initial
}: {
  mode: 'create' | 'edit';
  holidayId?: number;
  isActive?: boolean;
  reschedulingTypes: HolidayReschedulingTypeOption[];
  offices: FineractOfficeListItem[];
  initial?: Partial<HolidayFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<HolidayFormState>(() => ({
    ...defaultFormState(),
    ...initial
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reschedulingOptions = useMemo(
    () => toSelectOptions(reschedulingTypes),
    [reschedulingTypes]
  );

  const showPendingFields = mode === 'create' || !isActive;
  const showRepaymentDate =
    showPendingFields && Number(form.reschedulingType) === HOLIDAY_RESCHEDULE_SPECIFIC_DATE;

  function updateForm<K extends keyof HolidayFormState>(key: K, value: HolidayFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createHolidayAction({
          name: form.name,
          fromDate: form.fromDate,
          toDate: form.toDate,
          reschedulingType: Number(form.reschedulingType),
          repaymentsRescheduledTo: showRepaymentDate ? form.repaymentsRescheduledTo : undefined,
          description: form.description || undefined,
          offices: form.offices
        });
        if (!result.ok) {
          setSubmitError(result.message);
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }
        if (result.holidayId != null) {
          router.push(holidayDetailPath(result.holidayId));
        } else {
          router.push(HOLIDAY_LIST_PATH);
        }
        router.refresh();
        return;
      }

      const result = isActive
        ? await updateHolidayAction(
            String(holidayId),
            {
              name: form.name,
              description: form.description || undefined
            },
            true
          )
        : await updateHolidayAction(
            String(holidayId),
            {
              name: form.name,
              fromDate: form.fromDate,
              toDate: form.toDate,
              reschedulingType: Number(form.reschedulingType),
              repaymentsRescheduledTo: showRepaymentDate ? form.repaymentsRescheduledTo : undefined,
              description: form.description || undefined
            },
            false
          );

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      router.push(holidayId != null ? holidayDetailPath(holidayId) : HOLIDAY_LIST_PATH);
      router.refresh();
    });
  }

  const backHref =
    mode === 'edit' && holidayId != null ? holidayDetailPath(holidayId) : HOLIDAY_LIST_PATH;

  return (
    <ListPage
      title={mode === 'create' ? 'Create holiday' : 'Edit holiday'}
      description="Define holiday dates, repayment rescheduling rules, and applicable branches."
      backLink={
        <DetailBackLink
          href={backHref}
          label={mode === 'edit' ? 'Back to holiday' : 'Back to holidays'}
        />
      }
    >
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <TextField
          id="holiday-name"
          label="Name"
          required
          value={form.name}
          onChange={(value) => updateForm('name', value)}
          error={fieldErrors.name}
        />

        {showPendingFields ? (
          <>
            <DateField
              id="holiday-from-date"
              label="From date"
              required
              allowFuture
              value={form.fromDate}
              onChange={(value) => updateForm('fromDate', value ?? '')}
              error={fieldErrors.fromDate}
            />
            <DateField
              id="holiday-to-date"
              label="To date"
              required
              allowFuture
              value={form.toDate}
              onChange={(value) => updateForm('toDate', value ?? '')}
              error={fieldErrors.toDate}
            />
            <SelectField
              id="holiday-rescheduling-type"
              label="Repayment scheduling type"
              required
              value={form.reschedulingType}
              onValueChange={(value) => updateForm('reschedulingType', value ?? '')}
              options={reschedulingOptions}
              error={fieldErrors.reschedulingType}
            />
            {showRepaymentDate ? (
              <DateField
                id="holiday-repayment-date"
                label="Repayment scheduled to"
                required
                allowFuture
                value={form.repaymentsRescheduledTo}
                onChange={(value) => updateForm('repaymentsRescheduledTo', value ?? '')}
                error={fieldErrors.repaymentsRescheduledTo}
              />
            ) : null}
          </>
        ) : null}

        <TextField
          id="holiday-description"
          label="Description"
          optional
          value={form.description}
          onChange={(value) => updateForm('description', value)}
          error={fieldErrors.description}
        />

        {mode === 'create' ? (
          <HolidayOfficePicker
            offices={offices}
            value={form.offices}
            onChange={(value) => updateForm('offices', value)}
            error={fieldErrors.offices}
            disabled={pending}
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create holiday' : 'Save changes'}
          </Button>
          <Link href={backHref} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
