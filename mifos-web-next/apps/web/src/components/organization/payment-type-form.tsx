'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationPaymentType } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createPaymentTypeAction, updatePaymentTypeAction } from '@/actions/payment-type';
import { DetailBackLink } from '@/components/composites';
import { NumericField } from '@/components/composites/numeric-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_TYPE_LIST_PATH } from '@/lib/fineract/payment-type-paths';
import { cn } from '@/lib/utils';

export function PaymentTypeCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [position, setPosition] = useState('1');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createPaymentTypeAction({
        name,
        description: description.trim() || undefined,
        isCashPayment,
        position: Number(position)
      });

      if (!result.ok) {
        const message = formatActionErrorMessage(result.message, result.fieldErrors);
        setSubmitError(message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Payment type created.');
      router.push(PAYMENT_TYPE_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <DetailBackLink href={PAYMENT_TYPE_LIST_PATH} label="Back to payment types" />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create payment type</h1>
        <p className="text-sm text-muted-foreground">
          Define how payments are classified in transactions and collections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-6">
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <PaymentTypeFields
          name={name}
          description={description}
          isCashPayment={isCashPayment}
          position={position}
          fieldErrors={fieldErrors}
          disabled={pending}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onIsCashPaymentChange={setIsCashPayment}
          onPositionChange={setPosition}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Link href={PAYMENT_TYPE_LIST_PATH} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create payment type'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function PaymentTypeEditForm({ paymentType }: { paymentType: OrganizationPaymentType }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(paymentType.name);
  const [description, setDescription] = useState(paymentType.description ?? '');
  const [isCashPayment, setIsCashPayment] = useState(Boolean(paymentType.isCashPayment));
  const [position, setPosition] = useState(
    paymentType.position != null ? String(paymentType.position) : '1'
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSystemDefined = Boolean(paymentType.isSystemDefined);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updatePaymentTypeAction(
        paymentType.id,
        isSystemDefined
          ? {
              name,
              description: description.trim() || undefined
            }
          : {
              name,
              description: description.trim() || undefined,
              isCashPayment,
              position: Number(position)
            },
        isSystemDefined
      );

      if (!result.ok) {
        const message = formatActionErrorMessage(result.message, result.fieldErrors);
        setSubmitError(message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Payment type updated.');
      router.push(PAYMENT_TYPE_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <DetailBackLink href={PAYMENT_TYPE_LIST_PATH} label="Back to payment types" />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit payment type</h1>
        {isSystemDefined ? (
          <p className="text-sm text-muted-foreground">
            System-defined payment types only allow name and description changes.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-6">
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <PaymentTypeFields
          name={name}
          description={description}
          isCashPayment={isCashPayment}
          position={position}
          fieldErrors={fieldErrors}
          disabled={pending}
          lockOperationalFields={isSystemDefined}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onIsCashPaymentChange={setIsCashPayment}
          onPositionChange={setPosition}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Link href={PAYMENT_TYPE_LIST_PATH} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PaymentTypeFields({
  name,
  description,
  isCashPayment,
  position,
  fieldErrors,
  disabled,
  lockOperationalFields = false,
  onNameChange,
  onDescriptionChange,
  onIsCashPaymentChange,
  onPositionChange
}: {
  name: string;
  description: string;
  isCashPayment: boolean;
  position: string;
  fieldErrors: Record<string, string>;
  disabled?: boolean;
  lockOperationalFields?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsCashPaymentChange: (value: boolean) => void;
  onPositionChange: (value: string) => void;
}) {
  return (
    <>
      <TextField
        label="Payment type"
        required
        value={name}
        onChange={onNameChange}
        error={fieldErrors.name}
        disabled={disabled}
      />
      <div className="space-y-2">
        <FieldLabel htmlFor="payment-type-description">Description</FieldLabel>
        <Textarea
          id="payment-type-description"
          rows={3}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          disabled={disabled}
        />
      </div>
      <Field orientation="horizontal" className="items-center gap-3">
        <Checkbox
          id="payment-type-cash"
          checked={isCashPayment}
          onCheckedChange={(checked) => onIsCashPaymentChange(checked === true)}
          disabled={disabled || lockOperationalFields}
        />
        <FieldContent>
          <FieldLabel htmlFor="payment-type-cash">Is cash payment?</FieldLabel>
        </FieldContent>
      </Field>
      <NumericField
        label="Position"
        required
        value={position}
        onChange={onPositionChange}
        error={fieldErrors.position}
        disabled={disabled || lockOperationalFields}
      />
    </>
  );
}
