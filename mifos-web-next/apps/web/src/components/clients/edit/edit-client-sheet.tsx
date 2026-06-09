'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientEditData } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, type UpdateClientInput } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { loadClientForEditAction } from '@/actions/client-edit-load';
import { updateClientAction } from '@/actions/client-update';
import { FormSheet } from '@/components/composites/form-sheet';
import { EditClientFormFields } from '@/components/clients/edit/edit-client-form-fields';
import { mapClientToEditFormInput } from '@/lib/fineract/client-edit-map';

export const EDIT_CLIENT_FORM_ID = 'edit-client-form';

/** Wide side panel for full client edit (ADR-006 exception: many fields, keeps detail context). */
const EDIT_PANEL_CLASS =
  'data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl';

export function EditClientSheet({
  clientId,
  open,
  onOpenChange
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initial, setInitial] = useState<FineractClientEditData | null>(null);
  const [form, setForm] = useState<UpdateClientInput | null>(null);
  const [initialForm, setInitialForm] = useState<UpdateClientInput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSubmitError(null);
    setFieldErrors({});

    void loadClientForEditAction(clientId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.message);
        setInitial(null);
        setForm(null);
        setInitialForm(null);
        return;
      }
      const mapped = mapClientToEditFormInput(result.data);
      setInitial(result.data);
      setInitialForm(mapped);
      setForm(mapped);
    });

    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  function patch(patch: Partial<UpdateClientInput>) {
    setForm((prev) => (prev ? ({ ...prev, ...patch }) as UpdateClientInput : prev));
  }

  function patchNonPerson(
    patch: Partial<
      NonNullable<
        Extract<UpdateClientInput, { legalFormId: typeof LEGAL_FORM_ENTITY }>['clientNonPersonDetails']
      >
    >
  ) {
    setForm((prev) => {
      if (!prev || prev.legalFormId !== LEGAL_FORM_ENTITY) {
        return prev;
      }
      return {
        ...prev,
        clientNonPersonDetails: { ...prev.clientNonPersonDetails, ...patch }
      };
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !initialForm) {
      return;
    }
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateClientAction(clientId, form, initialForm);
      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toast.success('Client updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit client"
      description="Update names, contact details, classification, and dates."
      formId={EDIT_CLIENT_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
      submitDisabled={loading || !form}
      className={EDIT_PANEL_CLASS}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading client details…</p>
      ) : null}
      {loadError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}
      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}
      {initial && form ? (
        <form id={EDIT_CLIENT_FORM_ID} onSubmit={handleSubmit}>
          <EditClientFormFields
            initial={initial}
            form={form}
            fieldErrors={fieldErrors}
            onPatch={patch}
            onPatchNonPerson={patchNonPerson}
          />
        </form>
      ) : null}
    </FormSheet>
  );
}
