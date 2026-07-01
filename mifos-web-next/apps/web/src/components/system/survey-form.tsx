'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, validateUpsertSurveyForm, type UpsertSurveyFormInput } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createSurveyAction, updateSurveyAction } from '@/actions/surveys';
import { TextField } from '@/components/composites/text-field';
import { SurveyQuestionsEditor } from '@/components/system/survey-questions-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { withSurveySequenceNumbers } from '@/lib/fineract/survey-display';
import { cn } from '@/lib/utils';

export function SurveyForm({
  mode,
  surveyId,
  initialValues
}: {
  mode: 'create' | 'edit';
  surveyId?: number;
  initialValues: UpsertSurveyFormInput;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<UpsertSurveyFormInput>(() => ({
    ...initialValues,
    questionDatas: withSurveySequenceNumbers(initialValues.questionDatas)
  }));
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patchForm(patch: Partial<UpsertSurveyFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertSurveyFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const normalized = {
      ...formRef.current,
      questionDatas: withSurveySequenceNumbers(formRef.current.questionDatas)
    };
    const parsed = validateUpsertSurveyForm(normalized);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSurveyAction(parsed.data)
          : await updateSurveyAction(surveyId as number, parsed.data);

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      if (mode === 'create' && result.resourceId != null) {
        router.push(`/system/surveys/${result.resourceId}`);
      } else if (surveyId != null) {
        router.push(`/system/surveys/${surveyId}`);
      } else {
        router.push('/system/surveys');
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create' ? 'Survey created.' : 'Survey updated.', pending: mode === 'create' ? 'Survey created. sent for approval.' : 'Survey updated. sent for approval.' });
      router.refresh();
    });
  }

  return (
    <form
      id={formId}
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Key"
          required
          value={form.key}
          onChange={(value) => patchForm({ key: value })}
          disabled={pending}
          error={fieldErrors.key}
        />
        <TextField
          label="Name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          disabled={pending}
          error={fieldErrors.name}
        />
        <TextField
          label="Country code"
          required
          value={form.countryCode}
          onChange={(value) => patchForm({ countryCode: value.toUpperCase() })}
          disabled={pending}
          error={fieldErrors.countryCode}
          hint="Two-letter country code, for example US or KE."
        />
        <TextField
          label="Description"
          optional
          multiline
          rows={2}
          value={form.description ?? ''}
          onChange={(value) => patchForm({ description: value })}
          disabled={pending}
          error={fieldErrors.description}
        />
      </div>

      <SurveyQuestionsEditor
        questions={form.questionDatas}
        onChange={(questionDatas) => patchForm({ questionDatas })}
        fieldErrors={fieldErrors}
        disabled={pending}
      />

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create survey' : 'Save changes'}
        </Button>
        <Link
          href={
            mode === 'edit' && surveyId != null ? `/system/surveys/${surveyId}` : '/system/surveys'
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
