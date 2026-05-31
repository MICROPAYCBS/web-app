'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import type { FineractClientTemplate } from '@mifos/api-client';
import { createClientSchema, type CreateClientInput } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { createClientAction } from '@/actions/clients';
import { FormSheet } from '@/components/composites/form-sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';

const formId = 'create-client-form';

export function CreateClientSheet({
  open,
  onOpenChange,
  template
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractClientTemplate | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      officeId: undefined,
      firstname: '',
      lastname: '',
      externalId: '',
      active: false,
      submittedOnDate: toFineractDate(),
      activationDate: toFineractDate(),
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    }
  });

  const officeId = useWatch({ control: form.control, name: 'officeId' });
  const active = useWatch({ control: form.control, name: 'active' }) ?? false;

  useEffect(() => {
    if (!open) {
      form.reset({
        officeId: undefined,
        firstname: '',
        lastname: '',
        externalId: '',
        active: false,
        submittedOnDate: toFineractDate(),
        activationDate: toFineractDate(),
        dateFormat: FINERACT_DATE_FORMAT,
        locale: FINERACT_LOCALE
      });
      setFormError(null);
    }
  }, [open, form]);

  function onSubmit(values: CreateClientInput) {
    setFormError(null);
    startTransition(async () => {
      const payload: CreateClientInput = {
        ...values,
        officeId: Number(values.officeId),
        externalId: values.externalId?.trim() || undefined,
        activationDate: values.active ? values.activationDate : undefined
      };
      const result = await createClientAction(createClientSchema.parse(payload));
      if (!result.ok) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CreateClientInput, { message });
          }
        }
        return;
      }
      onOpenChange(false);
      router.push(`/clients/${result.clientId}`);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create client"
      description="Add a new client (person). Additional steps such as addresses can follow in a later release."
      formId={formId}
      submitLabel="Create client"
      submitLoading={pending}
      submitDisabled={!form.formState.isValid && form.formState.isSubmitted}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {formError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="officeId">Office</Label>
          <Select
            value={officeId ? String(officeId) : ''}
            onValueChange={(v) => form.setValue('officeId', Number(v), { shouldValidate: true })}
          >
            <SelectTrigger id="officeId" className="w-full">
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              {template?.officeOptions?.map((office) => (
                <SelectItem key={office.id} value={String(office.id)}>
                  {office.nameDecorated ?? office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.officeId ? (
            <p className="text-xs text-destructive">{form.formState.errors.officeId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstname">First name</Label>
          <Input id="firstname" {...form.register('firstname')} autoComplete="given-name" />
          {form.formState.errors.firstname ? (
            <p className="text-xs text-destructive">{form.formState.errors.firstname.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastname">Last name</Label>
          <Input id="lastname" {...form.register('lastname')} autoComplete="family-name" />
          {form.formState.errors.lastname ? (
            <p className="text-xs text-destructive">{form.formState.errors.lastname.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="submittedOnDate">Submitted on</Label>
          <Input id="submittedOnDate" {...form.register('submittedOnDate')} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked) => form.setValue('active', checked === true)}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        {active ? (
          <div className="space-y-2">
            <Label htmlFor="activationDate">Activation date</Label>
            <Input id="activationDate" {...form.register('activationDate')} />
            {form.formState.errors.activationDate ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.activationDate.message}
              </p>
            ) : null}
          </div>
        ) : null}
      </form>
    </FormSheet>
  );
}
