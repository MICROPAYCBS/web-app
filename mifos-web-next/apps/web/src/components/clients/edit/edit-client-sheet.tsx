'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientEditData } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, type UpdateClientInput, formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { loadClientForEditAction } from '@/actions/client-edit-load';
import { updateClientAction } from '@/actions/client-update';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { EditClientFormFields } from '@/components/clients/edit/edit-client-form-fields';
import { hasUpdateClientChanges } from '@/lib/fineract/build-update-client-payload';
import { mapClientToEditFormInput } from '@/lib/fineract/client-edit-map';
import { validateCustomerClassFormFields } from '@/lib/fineract/customer-class-eligibility';

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

  const hasChanges = useMemo(() => {
    if (!form || !initialForm) {
      return false;
    }
    return hasUpdateClientChanges(form, { initial: initialForm });
  }, [form, initialForm]);

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
    if (!form || !initialForm || !initial) {
      return;
    }
    if (!hasUpdateClientChanges(form, { initial: initialForm })) {
      return;
    }
    setSubmitError(null);
    setFieldErrors({});

    const classFieldErrors = validateCustomerClassFormFields({
      customerClassId: form.customerClassId,
      customerClassOptions: initial.customerClassOptions,
      dateOfBirth: form.dateOfBirth,
      legalFormId: form.legalFormId
    });
    if (Object.keys(classFieldErrors).length > 0) {
      setFieldErrors(classFieldErrors);
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = await updateClientAction(clientId, form);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toast.success('Customer updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit customer"
      description="Update names, contact details, customer class, and dates."
      formId={EDIT_CLIENT_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
      submitDisabled={loading || !form || !hasChanges}
      className={EDIT_PANEL_CLASS}
      error={
        submitError ? (
          <FormErrorAlert>{submitError}</FormErrorAlert>
        ) : loadError ? (
          <FormErrorAlert>{loadError}</FormErrorAlert>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customer details…</p>
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
