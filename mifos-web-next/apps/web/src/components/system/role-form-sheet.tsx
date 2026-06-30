'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  formatActionErrorMessage,
  validateCreateRole,
  validateUpdateRole
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createRoleAction, updateRoleAction } from '@/actions/system-roles';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';

export type RoleFormInitial = {
  name: string;
  description: string;
};

function formStateFromInitial(initial?: RoleFormInitial) {
  return {
    name: initial?.name ?? '',
    description: initial?.description ?? ''
  };
}

export function RoleFormSheet({
  open,
  onOpenChange,
  mode,
  roleId,
  initial
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  roleId?: number;
  initial?: RoleFormInitial;
}) {
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState(() => formStateFromInitial(initial).name);
  const [description, setDescription] = useState(() => formStateFromInitial(initial).description);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      const next = formStateFromInitial(initial);
      setName(next.name);
      setDescription(next.description);
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [open, initial?.name, initial?.description]);

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

    if (mode === 'create') {
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

        toastCommandOutcome(result, { completed: 'Role created.', pending: 'Role creation sent for approval.' });
        onOpenChange(false);
        if (result.resourceId != null) {
          router.push(`/system/roles-and-permissions/${result.resourceId}`);
        } else {
          router.refresh();
        }
      });
      return;
    }

    const parsed = validateUpdateRole({ description });
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

    if (roleId == null) {
      return;
    }

    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateRoleAction(roleId, parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toastCommandOutcome(result, { completed: 'Role updated.', pending: 'Role update sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  const isCreate = mode === 'create';
  const title = isCreate ? 'Create role' : 'Edit role';
  const sheetDescription = isCreate
    ? 'Add a new role, then assign permissions on the role detail page.'
    : 'Update the role description. Role names cannot be changed after creation.';

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={sheetDescription}
      formId={formId}
      submitLabel={isCreate ? 'Create role' : 'Save changes'}
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={isCreate ? !name.trim() || !description.trim() : !description.trim()}
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
            if (!isCreate) {
              return;
            }
            setName(value);
            if (fieldErrors.name) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.name;
                return next;
              });
            }
          }}
          disabled={pending || !isCreate}
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
