'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { WorkingDaysConfiguration } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import type { WorkingWeekDayCode } from '@mifos/validation';
import { useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { updateWorkingDaysAction } from '@/actions/working-days';
import { FormLabel } from '@/components/composites/form-label';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  parseWorkingDaysRecurrence,
  WORKING_WEEK_DAYS
} from '@/lib/fineract/working-days-display';

type WorkingDaysFormState = {
  weekDays: WorkingWeekDayCode[];
  repaymentRescheduleType: string;
  extendTermForDailyRepayments: boolean;
};

function formStateFromConfiguration(config: WorkingDaysConfiguration): WorkingDaysFormState {
  return {
    weekDays: parseWorkingDaysRecurrence(config.recurrence),
    repaymentRescheduleType: String(config.repaymentRescheduleType.id),
    extendTermForDailyRepayments: config.extendTermForDailyRepayments ?? false
  };
}

export function WorkingDaysPageContent({
  configuration,
  canUpdate
}: {
  configuration: WorkingDaysConfiguration;
  canUpdate: boolean;
}) {
  const initial = useMemo(() => formStateFromConfiguration(configuration), [configuration]);
  const [form, setForm] = useState<WorkingDaysFormState>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const rescheduleOptions = useMemo(
    () => toSelectOptions(configuration.repaymentRescheduleOptions),
    [configuration.repaymentRescheduleOptions]
  );

  const dirty =
    JSON.stringify(form.weekDays.sort()) !== JSON.stringify(initial.weekDays.sort()) ||
    form.repaymentRescheduleType !== initial.repaymentRescheduleType ||
    form.extendTermForDailyRepayments !== initial.extendTermForDailyRepayments;

  function toggleWeekDay(code: WorkingWeekDayCode, checked: boolean) {
    setForm((current) => {
      const next = new Set(current.weekDays);
      if (checked) {
        next.add(code);
      } else {
        next.delete(code);
      }
      return { ...current, weekDays: [...next] };
    });
  }

  function handleReset() {
    setForm(initial);
    setFieldErrors({});
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateWorkingDaysAction({
        weekDays: form.weekDays,
        repaymentRescheduleType: Number(form.repaymentRescheduleType),
        extendTermForDailyRepayments: form.extendTermForDailyRepayments
      });

      if (!result.ok) {

        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        return;
      }
      toastCommandOutcome(result, { completed: 'Working days updated.', pending: 'Working days updated sent for approval.' });
        toastFineractError(result.message);
        return;
      }
    });
  }

  const disabled = pending || !canUpdate;

  return (
    <ListPage
      title="Working days"
      description="Define which days are working days and how repayments due on non-working days are handled."
    >
      <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSubmit}>
        <Field>
          <FormLabel required>Working days</FormLabel>
          <FieldContent>
            <div className="space-y-2 rounded-lg border border-border p-4">
              {WORKING_WEEK_DAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.weekDays.includes(day.value)}
                    disabled={disabled}
                    onCheckedChange={(checked) => toggleWeekDay(day.value, checked === true)}
                  />
                  <span>{day.name}</span>
                </label>
              ))}
            </div>
            {fieldErrors.weekDays ? <FieldError>{fieldErrors.weekDays}</FieldError> : null}
          </FieldContent>
        </Field>

        <SelectField
          id="working-days-repayment-reschedule"
          label="Payments due on non-working days"
          required
          value={form.repaymentRescheduleType}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, repaymentRescheduleType: value ?? '' }))
          }
          options={rescheduleOptions}
          error={fieldErrors.repaymentRescheduleType}
          disabled={disabled}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="working-days-extend-term"
            checked={form.extendTermForDailyRepayments}
            disabled={disabled}
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                extendTermForDailyRepayments: checked === true
              }))
            }
          />
          <Label htmlFor="working-days-extend-term">Extend term for loans with daily repayment schedule</Label>
        </div>

        <Can permission="UPDATE_WORKINGDAYS">
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!dirty || pending}>
              Save changes
            </Button>
            <Button type="button" variant="outline" disabled={!dirty || pending} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </Can>
      </form>
    </ListPage>
  );
}
