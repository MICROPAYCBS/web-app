'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentOption } from '@mifos/api-client';
import type { TaxGroupMemberInput } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createTaxGroupAction } from '@/actions/tax-group';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';
import { TaxGroupMembersEditor } from '@/components/products/tax/tax-group-members-editor';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { taxGroupDetailPath, taxGroupsListPath } from '@/lib/fineract/tax-paths';

export const CREATE_TAX_GROUP_FORM_ID = 'create-tax-group-form';

export function TaxGroupCreateSheet({
  componentOptions,
  open,
  onOpenChange
}: {
  componentOptions: TaxComponentOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [members, setMembers] = useState<TaxGroupMemberInput[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setMembers([]);
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTaxGroupAction({ name, taxComponents: members });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Tax group created.',
        pending: 'Tax group created. sent for approval.'
      });
      onOpenChange(false);
      const id = result.resourceId;
      router.push(id ? taxGroupDetailPath(id) : taxGroupsListPath());
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create tax group"
      description="Name the group and assign tax components with effective dates."
      formId={CREATE_TAX_GROUP_FORM_ID}
      submitLabel="Create"
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-xl"
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={CREATE_TAX_GROUP_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          disabled={pending}
        />
        <TaxGroupMembersEditor
          members={members}
          onChange={setMembers}
          componentOptions={componentOptions}
          mode="create"
          disabled={pending}
        />
        {fieldErrors.taxComponents ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.taxComponents}
          </p>
        ) : null}
      </form>
    </FormSheet>
  );
}
