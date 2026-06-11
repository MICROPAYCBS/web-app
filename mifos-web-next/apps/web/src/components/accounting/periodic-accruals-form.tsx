'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import {
  formatActionErrorMessage,
  validateExecutePeriodicAccruals,
  type ExecutePeriodicAccrualsInput
} from '@mifos/validation';
import { Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { executePeriodicAccrualsAction } from '@/actions/periodic-accruals';
import { DateField } from '@/components/composites/date-field';
import { ListPage } from '@/components/composites/list-page';
import { Button, buttonVariants } from '@/components/ui/button';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function defaultFormValues(): ExecutePeriodicAccrualsInput {
  return {
    tillDate: '',
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function PeriodicAccrualsForm({ canExecute }: { canExecute: boolean }) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<ExecutePeriodicAccrualsInput>(() => defaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (pending || !canExecute) {
      return;
    }

    setSubmitError(null);
    const parsed = validateExecutePeriodicAccruals(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const result = await executePeriodicAccrualsAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success('Periodic accruals completed.');
      setForm(defaultFormValues());
      router.push('/accounting');
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Periodic accruals"
      description="Run periodic accrual accounting for loan products up to the selected date."
    >
      <div className="max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          id={formId}
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <DateField
            id={`${formId}-till-date`}
            label="Accrue till date"
            value={form.tillDate}
            onChange={(date) => setForm((current) => ({ ...current, tillDate: date ?? '' }))}
            error={fieldErrors.tillDate}
            required
            disabled={pending || !canExecute}
          />

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Link href="/accounting" className={cn(buttonVariants({ variant: 'outline' }))}>
              Cancel
            </Link>
            <Can permission="EXECUTE_PERIODICACCRUALACCOUNTING">
              <Button type="submit" disabled={pending || !form.tillDate}>
                <Play className="mr-2 size-4" />
                Run periodic accruals
              </Button>
            </Can>
          </div>
        </form>
      </div>
    </ListPage>
  );
}
