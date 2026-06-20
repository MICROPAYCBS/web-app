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
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createClientStandingInstructionAction,
  fetchStandingInstructionTemplateAction
} from '@/actions/client-standing-instruction';
import { isStandingInstructionActionError } from '@/lib/fineract/standing-instruction-action-result';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { standingInstructionEnumLabel } from '@/lib/fineract/standing-instruction-display';

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
  open,
  onOpenChange
}: {
  clientId: string;
  fromOfficeId: number;
  fromAccountType: string;
  initialTemplate: StandingInstructionTemplate;
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
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setTemplateLoadError(null);
    skipCascadeRef.current = true;
    loadTemplate(EMPTY_FORM);
  }, [open, initialTemplate, loadTemplate]);

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

  function enumOptions(options: StandingInstructionTemplate[keyof StandingInstructionTemplate]) {
    if (!Array.isArray(options)) {
      return [];
    }
    return options.map((opt) => ({
      value: String((opt as { id: number }).id),
      label: standingInstructionEnumLabel(opt as { id: number; value?: string; code?: string })
    }));
  }

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
      const result = await createClientStandingInstructionAction(clientId, fromOfficeId, {
        ...form,
        amount: form.amount ? Number(form.amount) : undefined,
        recurrenceInterval: form.recurrenceInterval
          ? Number(form.recurrenceInterval)
          : undefined
      });
      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toast.success('Standing instruction created.');
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

          <div className="space-y-2">
            <Label>Transfer type</Label>
            <Select
              value={form.transferType}
              onValueChange={(v) => patchForm({ transferType: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.transferTypeOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.transferType} />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => patchForm({ priority: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.priorityOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.priority} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => patchForm({ status: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.statusOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.status} />
          </div>

          <div className="space-y-2">
            <Label>From account type</Label>
            <Select
              value={form.fromAccountType}
              onValueChange={(v) => patchForm({ fromAccountType: v ?? '', fromAccountId: '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.fromAccountTypeOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.fromAccountType} />
          </div>

          <div className="space-y-2">
            <Label>From account</Label>
            <Select
              value={form.fromAccountId}
              onValueChange={(v) => patchForm({ fromAccountId: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {(template.fromAccountOptions ?? []).map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {[account.productName, account.accountNo].filter(Boolean).join(' — ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.fromAccountId} />
          </div>

          <div className="space-y-2">
            <Label>Destination</Label>
            <Select
              value={form.destination}
              onValueChange={(v) => patchForm({ destination: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Own account</SelectItem>
                <SelectItem value="2">Other customer</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.destination} />
          </div>

          <div className="space-y-2">
            <Label>To branch</Label>
            <Select
              value={form.toOfficeId}
              onValueChange={(v) =>
                patchForm({ toOfficeId: v ?? '', toClientId: '', toAccountId: '' })
              }
              disabled={formDisabled || lockBeneficiary}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {(template.toOfficeOptions ?? []).map((office) => (
                  <SelectItem key={office.id} value={String(office.id)}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.toOfficeId} />
          </div>

          <div className="space-y-2">
            <Label>Beneficiary</Label>
            <Select
              value={form.toClientId}
              onValueChange={(v) => patchForm({ toClientId: v ?? '', toAccountId: '' })}
              disabled={formDisabled || lockBeneficiary}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {(template.toClientOptions ?? []).map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.displayName ?? client.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.toClientId} />
          </div>

          <div className="space-y-2">
            <Label>To account type</Label>
            <Select
              value={form.toAccountType}
              onValueChange={(v) => patchForm({ toAccountType: v ?? '', toAccountId: '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.toAccountTypeOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.toAccountType} />
          </div>

          <div className="space-y-2">
            <Label>To account</Label>
            <Select
              value={form.toAccountId}
              onValueChange={(v) => patchForm({ toAccountId: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {(template.toAccountOptions ?? []).map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {[account.productName, account.accountNo].filter(Boolean).join(' — ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.toAccountId} />
          </div>

          <div className="space-y-2">
            <Label>Instruction type</Label>
            <Select
              value={form.instructionType}
              onValueChange={(v) => patchForm({ instructionType: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.instructionTypeOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.instructionType} />
          </div>

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

          <div className="space-y-2">
            <Label>Recurrence type</Label>
            <Select
              value={form.recurrenceType}
              onValueChange={(v) => patchForm({ recurrenceType: v ?? '' })}
              disabled={formDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                {enumOptions(template.recurrenceTypeOptions).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.recurrenceType} />
          </div>

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

              <div className="space-y-2">
                <Label>Recurrence frequency</Label>
                <Select
                  value={form.recurrenceFrequency}
                  onValueChange={(v) => patchForm({ recurrenceFrequency: v ?? '' })}
                  disabled={formDisabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {enumOptions(template.recurrenceFrequencyOptions).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.recurrenceFrequency} />
              </div>
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
