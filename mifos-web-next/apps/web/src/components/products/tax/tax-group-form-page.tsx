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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createTaxGroupAction, updateTaxGroupAction } from '@/actions/tax-group';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { TextField } from '@/components/composites/text-field';
import {
  TaxGroupMembersEditor,
  taxGroupMembersFromDetail
} from '@/components/products/tax/tax-group-members-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  taxConfigurationsPath,
  taxGroupDetailPath,
  taxGroupsListPath
} from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

export function TaxGroupFormPage({
  mode,
  taxGroupId,
  initialName,
  initialMembers,
  componentOptions
}: {
  mode: 'create' | 'edit';
  taxGroupId?: number;
  initialName?: string;
  initialMembers?: TaxGroupMemberInput[];
  componentOptions: TaxComponentOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName ?? '');
  const [members, setMembers] = useState<TaxGroupMemberInput[]>(initialMembers ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = { name, taxComponents: members };
      const result =
        mode === 'create'
          ? await createTaxGroupAction(payload)
          : await updateTaxGroupAction(String(taxGroupId), payload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Tax group created.' : 'Tax group updated.');
      const id = result.resourceId ?? taxGroupId;
      router.push(id ? taxGroupDetailPath(id) : taxGroupsListPath());
      router.refresh();
    });
  }

  return (
    <ListPage
      title={mode === 'create' ? 'Create tax group' : 'Edit tax group'}
      description="Name the group and assign tax components with effective dates."
      backLink={
        <DetailBackLink
          href={mode === 'create' ? taxGroupsListPath() : taxGroupDetailPath(taxGroupId ?? '')}
          label={mode === 'create' ? 'Back to tax groups' : 'Back to tax group'}
        />
      }
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}
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
          mode={mode}
          disabled={pending}
        />
        {fieldErrors.taxComponents ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.taxComponents}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create tax group' : 'Save changes'}
          </Button>
          <Link
            href={mode === 'create' ? taxGroupsListPath() : taxConfigurationsPath()}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
