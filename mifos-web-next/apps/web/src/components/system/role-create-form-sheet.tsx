'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, validateCreateRole } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createRoleAction } from '@/actions/system-roles';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';

export function RoleCreateFormSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
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

    const parsed = validateCreateRole({ name, description });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createRoleAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Role created.');
      handleOpenChange(false);
      if (result.resourceId != null) {
        router.push(`/system/roles-and-permissions/${result.resourceId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Create role"
      description="Add a new role, then assign permissions on the role detail page."
      formId={formId}
      submitLabel="Create role"
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={!name.trim() || !description.trim()}
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
          label="Role name"
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
          disabled={pending}
          error={fieldErrors.name}
          autoComplete="off"
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          required
          value={description}
          onChange={(value) => {
            setDescription(value);
            if (fieldErrors.description) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.description;
                return next;
              });
            }
          }}
          disabled={pending}
          error={fieldErrors.description}
          autoComplete="off"
        />
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
