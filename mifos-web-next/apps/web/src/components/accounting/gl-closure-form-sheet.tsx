'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlClosureDetail, FineractOfficeOption } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateCreateGlClosure,
  validateUpdateGlClosure,
  type CreateGlClosureInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createGlClosureAction, updateGlClosureAction } from '@/actions/gl-closures';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

function defaultCreateValues(): CreateGlClosureInput {
  return {
    officeId: 0,
    closingDate: '',
    comments: '',
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

function officeLabel(office: FineractOfficeOption): string {
  return office.nameDecorated?.trim() || office.name?.trim() || `Branch #${office.id}`;
}

export function GlClosureFormSheet({
  mode,
  open,
  onOpenChange,
  offices,
  closure
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offices: FineractOfficeOption[];
  closure?: FineractGlClosureDetail;
}) {
  const router = useRouter();
  const formId = useId();
  const [officeId, setOfficeId] = useState<string | undefined>();
  const [closingDate, setClosingDate] = useState('');
  const [comments, setComments] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: officeLabel(office)
      })),
    [offices]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    if (mode === 'edit' && closure) {
      setOfficeId(String(closure.officeId));
      setClosingDate(closure.closingDate);
      setComments(closure.comments ?? '');
      return;
    }
    setOfficeId(undefined);
    setClosingDate('');
    setComments('');
  }, [closure, mode, open]);

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

    if (mode === 'create') {
      const parsed = validateCreateGlClosure({
        officeId: Number(officeId),
        closingDate,
        comments,
        dateFormat: FINERACT_DATE_FORMAT,
        locale: FINERACT_LOCALE
      });
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

      startTransition(async () => {
        const result = await createGlClosureAction(parsed.data);
        if (!result.ok) {

          setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
      }
      toastCommandOutcome(result, { completed: 'Accounting closure created.', pending: 'Accounting closure created sent for approval.' });
        handleOpenChange(false);
        if (result.resourceId != null) {
          router.push(`/accounting/closing-entries/${result.resourceId}`);
        } else {
          router.refresh();
        }
      });
      return;
    }

    if (!closure) {
      return;
    }

    const parsed = validateUpdateGlClosure({ comments });
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

    startTransition(async () => {
      const result = await updateGlClosureAction(closure.id, parsed.data);
      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Accounting closure updated.', pending: 'Accounting closure updated sent for approval.' });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create closure' : 'Edit closure'}
      description={
        mode === 'create'
          ? 'Close accounting for a branch as of a specific date.'
          : 'Update comments on this accounting closure.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create closure' : 'Save changes'}
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={mode === 'create' ? !officeId || !closingDate : false}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <SelectField
          label="Branch"
          required
          value={officeId}
          onValueChange={setOfficeId}
          options={officeOptions}
          disabled={pending || mode === 'edit'}
          error={fieldErrors.officeId}
          placeholder="Select branch"
        />

        <DateField
          id={`${formId}-closing-date`}
          label="Closing date"
          value={closingDate}
          onChange={(date) => setClosingDate(date ?? '')}
          error={fieldErrors.closingDate}
          required
          disabled={mode === 'edit' || pending}
        />

        <div className="space-y-2">
          <Label htmlFor={`${formId}-comments`}>Comments</Label>
          <Textarea
            id={`${formId}-comments`}
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            rows={3}
            disabled={pending}
          />
          {fieldErrors.comments ? (
            <p className="text-sm text-destructive">{fieldErrors.comments}</p>
          ) : null}
        </div>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
