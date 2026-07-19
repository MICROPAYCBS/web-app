'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  createClientStandingInstructionAction,
  fetchStandingInstructionTemplateAction
} from '@/actions/client-standing-instruction';
import { isStandingInstructionActionError } from '@/lib/fineract/standing-instruction-action-result';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  standingInstructionAccountSelectOptions,
  standingInstructionClientSelectOptions,
  standingInstructionDestinationSelectOptions,
  standingInstructionEnumSelectOptions,
  standingInstructionOfficeSelectOptions
} from '@/lib/fineract/standing-instruction-display';

export const CREATE_STANDING_INSTRUCTION_FORM_ID = 'create-standing-instruction-form';

const DESTINATION_OWN_ACCOUNT = 1;

const PANEL_CLASS =
  'data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl';

type FormState = {
  name: string;
  transferType: string;
  priority: string;
  status: string;
  fromAccountType: string;
  fromAccountId: string;
  destination: string;
  toOfficeId: string;
  toClientId: string;
  toAccountType: string;
  toAccountId: string;
  instructionType: string;
  amount: string;
  validFrom: string;
  validTill: string;
  recurrenceType: string;
  recurrenceInterval: string;
  recurrenceFrequency: string;
  recurrenceOnMonthDay: string;
};

export type CreateStandingInstructionFormDefaults = Partial<FormState>;

const EMPTY_FORM: FormState = {
  name: '',
  transferType: '',
  priority: '',
  status: '',
  fromAccountType: '',
  fromAccountId: '',
  destination: '',
  toOfficeId: '',
  toClientId: '',
  toAccountType: '',
  toAccountId: '',
  instructionType: '',
  amount: '',
  validFrom: '',
  validTill: '',
  recurrenceType: '',
  recurrenceInterval: '',
  recurrenceFrequency: '',
  recurrenceOnMonthDay: ''
};

function formToCascade(form: FormState): Record<string, string | number | undefined> {
  const entries: Record<string, string | number | undefined> = {};
  for (const [key, value] of Object.entries(form)) {
    if (key === 'name' || key === 'amount' || key === 'validFrom' || key === 'validTill') {
      continue;
    }
    if (key === 'destination') {
      continue;
    }
    if (value !== '') {
      entries[key] = value;
    }
  }
  return entries;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CreateStandingInstructionSheet({
  clientId,
  fromOfficeId,
  fromAccountType,
  initialTemplate,
  initialFormDefaults,
  revalidatePaths,
  open,
  onOpenChange
}: {
  clientId: string;
  fromOfficeId: number;
  fromAccountType: string;
  initialTemplate: StandingInstructionTemplate;
  initialFormDefaults?: CreateStandingInstructionFormDefaults;
  revalidatePaths?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipCascadeRef = useRef(false);

  const loadTemplate = useCallback(
    (nextForm: FormState) => {
      startRefresh(async () => {
        const result = await fetchStandingInstructionTemplateAction({
          fromClientId: clientId,
          fromOfficeId,
          fromAccountType,
          cascade: formToCascade(nextForm)
        });
        if (isStandingInstructionActionError(result)) {
          setTemplateLoadError(result.message);
          return;
        }
        setTemplateLoadError(null);
        setTemplate(result);
      });
    },
    [clientId, fromOfficeId, fromAccountType]
  );

  useEffect(() => {
    if (!open) {
      setTemplate(initialTemplate);
      return;
    }
    setTemplate(initialTemplate);
    const seededForm = { ...EMPTY_FORM, ...initialFormDefaults };
    setForm(seededForm);
    setFieldErrors({});
    setSubmitError(null);
    setTemplateLoadError(null);
    skipCascadeRef.current = true;
    loadTemplate(seededForm);
  }, [open, initialTemplate, initialFormDefaults, loadTemplate]);

  const lockBeneficiary = form.destination === String(DESTINATION_OWN_ACCOUNT);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (skipCascadeRef.current) {
      skipCascadeRef.current = false;
      return;
    }
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(() => {
      loadTemplate(form);
    }, 300);
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [
    open,
    form.transferType,
    form.fromAccountType,
    form.fromAccountId,
    form.toOfficeId,
    form.toClientId,
    form.toAccountType,
    form.toAccountId,
    form.instructionType,
    form.recurrenceType,
    form.recurrenceFrequency,
    loadTemplate,
    form
  ]);

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.destination === String(DESTINATION_OWN_ACCOUNT)) {
        next.toOfficeId = String(fromOfficeId);
        next.toClientId = String(clientId);
      }
      return next;
    });
  }

  const templateOptions = useMemo(
    () => ({
      transferType: standingInstructionEnumSelectOptions(
        Array.isArray(template.transferTypeOptions) ? template.transferTypeOptions : undefined
      ),
      priority: standingInstructionEnumSelectOptions(
        Array.isArray(template.priorityOptions) ? template.priorityOptions : undefined
      ),
      status: standingInstructionEnumSelectOptions(
        Array.isArray(template.statusOptions) ? template.statusOptions : undefined
      ),
      fromAccountType: standingInstructionEnumSelectOptions(
        Array.isArray(template.fromAccountTypeOptions) ? template.fromAccountTypeOptions : undefined
      ),
      fromAccount: standingInstructionAccountSelectOptions(template.fromAccountOptions),
      toOffice: standingInstructionOfficeSelectOptions(template.toOfficeOptions),
      toClient: standingInstructionClientSelectOptions(template.toClientOptions),
      toAccountType: standingInstructionEnumSelectOptions(
        Array.isArray(template.toAccountTypeOptions) ? template.toAccountTypeOptions : undefined
      ),
      toAccount: standingInstructionAccountSelectOptions(template.toAccountOptions),
      instructionType: standingInstructionEnumSelectOptions(
        Array.isArray(template.instructionTypeOptions) ? template.instructionTypeOptions : undefined
      ),
      recurrenceType: standingInstructionEnumSelectOptions(
        Array.isArray(template.recurrenceTypeOptions) ? template.recurrenceTypeOptions : undefined
      ),
      recurrenceFrequency: standingInstructionEnumSelectOptions(
        Array.isArray(template.recurrenceFrequencyOptions)
          ? template.recurrenceFrequencyOptions
          : undefined
      )
    }),
    [template]
  );

  const showAmount = form.instructionType === '1';
  const showRecurrenceFields = form.recurrenceType === '1';
  const showMonthDay =
    showRecurrenceFields &&
    (form.recurrenceFrequency === '2' || form.recurrenceFrequency === '3');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createClientStandingInstructionAction(
        clientId,
        fromOfficeId,
        {
          ...form,
          amount: form.amount ? Number(form.amount) : undefined,
          recurrenceInterval: form.recurrenceInterval
            ? Number(form.recurrenceInterval)
            : undefined
        },
        { revalidatePaths }
      );
      if (!result.ok) {

        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Standing instruction created.', pending: 'Standing instruction created sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  const dateFormat = template.dateFormat;
  const disabled = pending || refreshing;
  const formDisabled = disabled || Boolean(templateLoadError);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New standing instruction"
      description="Configure an automated transfer from this customer's account."
      formId={CREATE_STANDING_INSTRUCTION_FORM_ID}
      submitLabel="Create"
      submitLoading={pending}
      submitDisabled={disabled || Boolean(templateLoadError)}
      className={PANEL_CLASS}
    >
      {refreshing && !templateLoadError ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading form options…</p>
      ) : null}
      {templateLoadError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {templateLoadError}
        </p>
      ) : null}
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formatActionErrorMessage(submitError, fieldErrors)}
        </p>
      ) : null}
      <form id={CREATE_STANDING_INSTRUCTION_FORM_ID} onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="si-name">Name</Label>
            <Input
              id="si-name"
              value={form.name}
            disabled={formDisabled}
            onChange={(e) => patchForm({ name: e.target.value })}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <SelectField
            id="si-transferType"
            label="Transfer type"
            value={form.transferType}
            onValueChange={(value) => value && patchForm({ transferType: value })}
            options={templateOptions.transferType}
            placeholder="Select type"
            disabled={formDisabled}
            error={fieldErrors.transferType}
          />

          <SelectField
            id="si-priority"
            label="Priority"
            value={form.priority}
            onValueChange={(value) => value && patchForm({ priority: value })}
            options={templateOptions.priority}
            placeholder="Select priority"
            disabled={formDisabled}
            error={fieldErrors.priority}
          />

          <SelectField
            id="si-status"
            label="Status"
            value={form.status}
            onValueChange={(value) => value && patchForm({ status: value })}
            options={templateOptions.status}
            placeholder="Select status"
            disabled={formDisabled}
            error={fieldErrors.status}
          />

          <SelectField
            id="si-fromAccountType"
            label="From account type"
            value={form.fromAccountType}
            onValueChange={(value) =>
              value && patchForm({ fromAccountType: value, fromAccountId: '' })
            }
            options={templateOptions.fromAccountType}
            placeholder="Select type"
            disabled={formDisabled}
            error={fieldErrors.fromAccountType}
          />

          <SelectField
            id="si-fromAccountId"
            label="From account"
            value={form.fromAccountId}
            onValueChange={(value) => value && patchForm({ fromAccountId: value })}
            options={templateOptions.fromAccount}
            placeholder="Select account"
            disabled={formDisabled}
            error={fieldErrors.fromAccountId}
          />

          <SelectField
            id="si-destination"
            label="Destination"
            value={form.destination}
            onValueChange={(value) => value && patchForm({ destination: value })}
            options={standingInstructionDestinationSelectOptions}
            placeholder="Select destination"
            disabled={formDisabled}
            error={fieldErrors.destination}
          />

          <SelectField
            id="si-toOfficeId"
            label="To branch"
            value={form.toOfficeId}
            onValueChange={(value) =>
              value && patchForm({ toOfficeId: value, toClientId: '', toAccountId: '' })
            }
            options={templateOptions.toOffice}
            placeholder="Select branch"
            disabled={formDisabled || lockBeneficiary}
            error={fieldErrors.toOfficeId}
          />

          <SelectField
            id="si-toClientId"
            label="Beneficiary"
            value={form.toClientId}
            onValueChange={(value) => value && patchForm({ toClientId: value, toAccountId: '' })}
            options={templateOptions.toClient}
            placeholder="Select customer"
            disabled={formDisabled || lockBeneficiary}
            error={fieldErrors.toClientId}
          />

          <SelectField
            id="si-toAccountType"
            label="To account type"
            value={form.toAccountType}
            onValueChange={(value) =>
              value && patchForm({ toAccountType: value, toAccountId: '' })
            }
            options={templateOptions.toAccountType}
            placeholder="Select type"
            disabled={formDisabled}
            error={fieldErrors.toAccountType}
          />

          <SelectField
            id="si-toAccountId"
            label="To account"
            value={form.toAccountId}
            onValueChange={(value) => value && patchForm({ toAccountId: value })}
            options={templateOptions.toAccount}
            placeholder="Select account"
            disabled={formDisabled}
            error={fieldErrors.toAccountId}
          />

          <SelectField
            id="si-instructionType"
            label="Instruction type"
            value={form.instructionType}
            onValueChange={(value) => value && patchForm({ instructionType: value })}
            options={templateOptions.instructionType}
            placeholder="Select type"
            disabled={formDisabled}
            error={fieldErrors.instructionType}
          />

          {showAmount ? (
            <NumericField
              id="si-amount"
              label="Amount"
              required
              value={form.amount}
              disabled={formDisabled}
              onChange={(value) => patchForm({ amount: value })}
              error={fieldErrors.amount}
            />
          ) : null}

          <DateField
            label="Valid from"
            required
            value={form.validFrom}
            onChange={(v) => patchForm({ validFrom: v ?? '' })}
            disabled={formDisabled}
            dateFormat={dateFormat}
            allowFuture
            error={fieldErrors.validFrom}
          />

          <DateField
            label="Valid to"
            required
            value={form.validTill}
            onChange={(v) => patchForm({ validTill: v ?? '' })}
            disabled={formDisabled}
            dateFormat={dateFormat}
            allowFuture
            error={fieldErrors.validTill}
          />

          <SelectField
            id="si-recurrenceType"
            label="Recurrence type"
            value={form.recurrenceType}
            onValueChange={(value) => value && patchForm({ recurrenceType: value })}
            options={templateOptions.recurrenceType}
            placeholder="Select recurrence"
            disabled={formDisabled}
            error={fieldErrors.recurrenceType}
          />

          {showRecurrenceFields ? (
            <>
              <NumericField
                id="si-interval"
                label="Interval"
                required
                integer
                value={form.recurrenceInterval}
                disabled={formDisabled}
                onChange={(value) => patchForm({ recurrenceInterval: value })}
                error={fieldErrors.recurrenceInterval}
              />

              <SelectField
                id="si-recurrenceFrequency"
                label="Recurrence frequency"
                value={form.recurrenceFrequency}
                onValueChange={(value) => value && patchForm({ recurrenceFrequency: value })}
                options={templateOptions.recurrenceFrequency}
                placeholder="Select frequency"
                disabled={formDisabled}
                error={fieldErrors.recurrenceFrequency}
              />
            </>
          ) : null}

          {showMonthDay ? (
            <DateField
              label="On month day"
              value={form.recurrenceOnMonthDay}
              onChange={(v) => patchForm({ recurrenceOnMonthDay: v ?? '' })}
              disabled={formDisabled}
              dateFormat="dd MMMM"
              allowFuture
              error={fieldErrors.recurrenceOnMonthDay}
            />
          ) : null}
        </div>
      </form>
    </FormSheet>
  );
}
