'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, validateCreateCode } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { createCodeAction } from '@/actions/system-code';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';

export function SystemCodeFormSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName('');
      setFieldErrors({});
      setSubmitError(null);
    }
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

    const parsed = validateCreateCode({ name: name.trim() });
    if (!parsed.success) {
      const nextFieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setSubmitError('Code name is required.');
      return;
    }

    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createCodeAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      handleOpenChange(false);
      if (result.resourceId != null) {
        router.push(`/system/codes/${result.resourceId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Create code"
      description="Add a new lookup code. You can add values after saving."
      formId={formId}
      submitLabel="Create code"
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={!name.trim()}
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
        <TextField
          id={`${formId}-name`}
          label="Code name"
          required
          value={name}
          onChange={(value) => {
            setName(value);
            if (fieldErrors.name) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.name;
                return next;
              });
            }
          }}
          error={fieldErrors.name}
          autoComplete="off"
          placeholder="e.g. Gender"
        />
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
