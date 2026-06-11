'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { validateCreateProvisioningEntry, type CreateProvisioningEntryInput } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createProvisioningEntryAction } from '@/actions/provisioning-entries';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

function defaultFormValues(): CreateProvisioningEntryInput {
  return {
    date: '',
    createjournalentries: false,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function ProvisioningEntryFormSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<CreateProvisioningEntryInput>(() => defaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(defaultFormValues());
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (pending) {
      return;
    }

    setSubmitError(null);
    const parsed = validateCreateProvisioningEntry(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const result = await createProvisioningEntryAction(parsed.data);
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setSubmitError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success('Provisioning entry created.');
      onOpenChange(false);
      if (result.resourceId != null) {
        router.push(`/accounting/provisioning-entries/${result.resourceId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Create provisioning entry"
      description="Generate provisioning amounts for active loan products as of the selected date."
      formId={formId}
      submitLabel="Create entry"
      onSubmit={handleSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <DateField
          id={`${formId}-date`}
          label="Date"
          value={form.date}
          onChange={(date) => setForm((current) => ({ ...current, date: date ?? '' }))}
          error={fieldErrors.date}
          required
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id={`${formId}-createjournalentries`}
            checked={form.createjournalentries}
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                createjournalentries: checked === true
              }))
            }
          />
          <Label htmlFor={`${formId}-createjournalentries`} className="font-normal">
            Create journal entries
          </Label>
        </div>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
