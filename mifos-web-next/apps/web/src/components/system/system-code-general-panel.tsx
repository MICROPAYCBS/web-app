'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { updateCodeAction } from '@/actions/system-code';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

export function SystemCodeGeneralPanel({
  codeId,
  initialName,
  systemDefined,
  valueCount
}: {
  codeId: number;
  initialName: string;
  systemDefined: boolean;
  valueCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  if (systemDefined) {
    return (
      <div className="max-w-lg space-y-4">
        <DetailFieldGrid columns={2}>
          <DetailField label="Code name">{initialName}</DetailField>
          <DetailField label="System defined">{formatYesNo(true)}</DetailField>
          <DetailField label="Values">{valueCount}</DetailField>
        </DetailFieldGrid>
        <p className="text-sm text-muted-foreground">
          System-defined codes cannot be renamed or deleted.
        </p>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateCodeAction(codeId, { name: name.trim() });
      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      router.refresh();
    });
  }

  const isDirty = name.trim() !== initialName.trim();

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}
      <TextField
        id="code-name"
        label="Code name"
        required
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        autoComplete="off"
        placeholder="e.g. Gender"
      />
      <div className="flex flex-wrap gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Can permission="UPDATE_CODE">
          <Button type="submit" disabled={pending || !name.trim() || !isDirty}>
            {pending ? 'Updating…' : 'Update code'}
          </Button>
        </Can>
      </div>
    </form>
  );
}
