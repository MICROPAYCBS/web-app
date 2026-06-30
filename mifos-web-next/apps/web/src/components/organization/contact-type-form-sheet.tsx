'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ContactType, ContactTypeTemplate } from '@mifos/api-client';

import {

  formatActionErrorMessage,

  type ContactTypeUpdateClearFields,

  type UpdateContactTypeInput,

  type UpsertContactTypeInput

} from '@mifos/validation';

import { useRouter } from 'next/navigation';

import { useEffect, useId, useState, useTransition } from 'react';

import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';

import { createContactTypeAction, updateContactTypeAction } from '@/actions/contact-type';

import { FormErrorAlert } from '@/components/composites/form-error-alert';

import { FormSheet } from '@/components/composites/form-sheet';

import { NumericField } from '@/components/composites/numeric-field';

import { SelectField } from '@/components/composites/select-field';

import { TextField } from '@/components/composites/text-field';

import { Checkbox } from '@/components/ui/checkbox';

import { Field, FieldContent, FieldLabel } from '@/components/ui/field';



type ContactTypeFormState = {

  typeCode: string;

  typeName: string;

  example: string;

  validationRegex: string;

  mandatory: boolean;

  displayOrder: string;

  status: string;

};



function defaultFormState(): ContactTypeFormState {

  return {

    typeCode: '',

    typeName: '',

    example: '',

    validationRegex: '',

    mandatory: false,

    displayOrder: '',

    status: 'ACTIVE'

  };

}



function formStateFromContactType(contactType: ContactType): ContactTypeFormState {

  return {

    typeCode: contactType.typeCode,

    typeName: contactType.typeName,

    example: contactType.example ?? '',

    validationRegex: contactType.validationRegex ?? '',

    mandatory: contactType.mandatory ?? false,

    displayOrder: contactType.displayOrder != null ? String(contactType.displayOrder) : '',

    status: contactType.status ?? 'ACTIVE'

  };

}



function toOptions(values: string[]) {

  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));

}



function buildSubmitInput(form: ContactTypeFormState): UpsertContactTypeInput {

  return {

    typeCode: form.typeCode,

    typeName: form.typeName,

    example: form.example || undefined,

    validationRegex: form.validationRegex || undefined,

    mandatory: form.mandatory,

    displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,

    status: form.status as UpsertContactTypeInput['status']

  };

}



function buildClearFields(

  form: ContactTypeFormState,

  initial?: ContactType

): ContactTypeUpdateClearFields {

  return {

    displayOrder: initial != null && initial.displayOrder != null && form.displayOrder === ''

  };

}



export function ContactTypeFormSheet({

  open,

  onOpenChange,

  mode,

  contactType,

  template

}: {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  mode: 'create' | 'edit';

  contactType?: ContactType;

  template: ContactTypeTemplate;

}) {

  const router = useRouter();

  const formId = useId();

  const [form, setForm] = useState<ContactTypeFormState>(defaultFormState);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formError, setFormError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();



  useEffect(() => {

    if (!open) {

      return;

    }

    setFieldErrors({});

    setFormError(null);

    setForm(

      mode === 'edit' && contactType ? formStateFromContactType(contactType) : defaultFormState()

    );

  }, [open, mode, contactType]);



  function handleSubmit(event: React.FormEvent) {

    event.preventDefault();

    setFieldErrors({});

    setFormError(null);

    const input = buildSubmitInput(form);



    startTransition(async () => {

      if (mode === 'create') {

        const result = await createContactTypeAction(input);

        if (!result.ok) {

          setFormError(formatActionErrorMessage(result.message, result.fieldErrors));

          if (result.fieldErrors) {

            setFieldErrors(result.fieldErrors);

          }

          return;

        }

        toastCommandOutcome(result, { completed: 'Contact type created.', pending: 'Contact type creation sent for approval.' });

        onOpenChange(false);

        router.refresh();

        return;

      }



      if (!contactType) {

        return;

      }



      const clear = buildClearFields(form, contactType);

      const result = await updateContactTypeAction(

        contactType.id,

        input as UpdateContactTypeInput,

        clear

      );

      if (!result.ok) {

        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));

        if (result.fieldErrors) {

          setFieldErrors(result.fieldErrors);

        }

        return;

      }

      toastCommandOutcome(result, { completed: 'Contact type updated.', pending: 'Contact type update sent for approval.' });

      onOpenChange(false);

      router.refresh();

    });

  }



  return (

    <FormSheet

      open={open}

      onOpenChange={onOpenChange}

      title={mode === 'create' ? 'Create contact type' : 'Edit contact type'}

      description="Define how customer contacts are captured and validated. Inactive types are hidden on customer forms."

      formId={formId}

      submitLoading={pending}

      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}

    >

      <form id={formId} onSubmit={handleSubmit} className="space-y-4">

        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}

        <TextField

          label="Type code"

          value={form.typeCode}

          onChange={(value) => setForm((current) => ({ ...current, typeCode: value }))}

          error={fieldErrors.typeCode}

          required

          disabled={pending}

        />

        <TextField

          label="Type name"

          value={form.typeName}

          onChange={(value) => setForm((current) => ({ ...current, typeName: value }))}

          error={fieldErrors.typeName}

          required

          disabled={pending}

        />

        <TextField

          label="Example"

          value={form.example}

          onChange={(value) => setForm((current) => ({ ...current, example: value }))}

          error={fieldErrors.example}

          disabled={pending}

          hint="Shown as placeholder when customers enter this contact type."

        />

        <TextField

          label="Validation regex"

          value={form.validationRegex}

          onChange={(value) => setForm((current) => ({ ...current, validationRegex: value }))}

          error={fieldErrors.validationRegex}

          disabled={pending}

          hint="Optional pattern used to validate contact values."

        />

        <Field>

          <FieldContent className="flex flex-row items-center gap-2">

            <Checkbox

              id={`${formId}-mandatory`}

              checked={form.mandatory}

              disabled={pending}

              onCheckedChange={(checked) =>

                setForm((current) => ({ ...current, mandatory: checked === true }))

              }

            />

            <FieldLabel htmlFor={`${formId}-mandatory`} className="font-normal">

              Mandatory for every customer

            </FieldLabel>

          </FieldContent>

        </Field>

        <NumericField

          label="Display order"

          value={form.displayOrder}

          onChange={(value) => setForm((current) => ({ ...current, displayOrder: value }))}

          error={fieldErrors.displayOrder}

          disabled={pending}

        />

        <SelectField

          label="Status"

          value={form.status}

          onValueChange={(value) =>

            setForm((current) => ({ ...current, status: value ?? 'ACTIVE' }))

          }

          options={toOptions(

            template.statusOptions.length > 0 ? template.statusOptions : ['ACTIVE', 'INACTIVE']

          )}

          error={fieldErrors.status}

          required

          disabled={pending}

        />

      </form>

    </FormSheet>

  );

}


