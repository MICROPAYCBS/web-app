'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractTemplateFormTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertTemplateForm,
  type TemplateMapperInput,
  type UpsertTemplateFormInput
} from '@mifos/validation';
import { Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createTemplateAction, updateTemplateAction } from '@/actions/templates';
import { FormLabel } from '@/components/composites/form-label';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  CLIENT_ENTITY_ID,
  defaultTemplateMapper,
  LOAN_ENTITY_ID,
  templateOptionLabel
} from '@/lib/fineract/template-display';
import {
  clientParameterLabels,
  loanParameterLabels,
  repaymentParameterLabels
} from '@/lib/templates/template-parameter-labels';
import { cn } from '@/lib/utils';

export function TemplateForm({
  mode,
  templateId,
  initialValues,
  formTemplate
}: {
  mode: 'create' | 'edit';
  templateId?: number;
  initialValues: UpsertTemplateFormInput;
  formTemplate: FineractTemplateFormTemplate;
}) {
  const router = useRouter();
  const formId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<UpsertTemplateFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const entityOptions = formTemplate.entities.map((option) => ({
    value: String(option.id),
    label: templateOptionLabel(option)
  }));
  const typeOptions = formTemplate.types.map((option) => ({
    value: String(option.id),
    label: templateOptionLabel(option)
  }));

  function patchForm(patch: Partial<UpsertTemplateFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertTemplateFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleEntityChange(value: string | undefined) {
    if (!value) {
      return;
    }
    const entity = Number(value);
    if (!Number.isFinite(entity)) {
      return;
    }
    patchForm({
      entity,
      text: '',
      mappers: [defaultTemplateMapper(entity)]
    });
  }

  function insertParameter(label: string) {
    const textarea = textRef.current;
    if (!textarea) {
      patchForm({ text: `${form.text}${label}` });
      return;
    }

    const start = textarea.selectionStart ?? form.text.length;
    const end = textarea.selectionEnd ?? form.text.length;
    const nextText = `${form.text.slice(0, start)}${label}${form.text.slice(end)}`;
    patchForm({ text: nextText });

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + label.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function updateMapper(index: number, patch: Partial<TemplateMapperInput>) {
    setForm((current) => {
      const mappers = current.mappers.map((mapper, mapperIndex) =>
        mapperIndex === index ? { ...mapper, ...patch } : mapper
      );
      const next = { ...current, mappers };
      formRef.current = next;
      return next;
    });
  }

  function addMapper() {
    setForm((current) => {
      const next = {
        ...current,
        mappers: [
          ...current.mappers,
          {
            mappersorder: current.mappers.length,
            mapperskey: '',
            mappersvalue: ''
          }
        ]
      };
      formRef.current = next;
      return next;
    });
    setAdvancedOpen(true);
  }

  function removeMapper(index: number) {
    if (index === 0) {
      return;
    }
    setForm((current) => {
      const mappers = current.mappers
        .filter((_, mapperIndex) => mapperIndex !== index)
        .map((mapper, mapperIndex) => ({ ...mapper, mappersorder: mapperIndex }));
      const next = { ...current, mappers };
      formRef.current = next;
      return next;
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertTemplateForm(formRef.current);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createTemplateAction(parsed.data)
          : await updateTemplateAction(templateId as number, parsed.data);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success(mode === 'create' ? 'Template created.' : 'Template updated.');
      if (mode === 'create' && result.resourceId != null) {
        router.push(`/templates/${result.resourceId}`);
      } else if (templateId != null) {
        router.push(`/templates/${templateId}`);
      } else {
        router.push('/templates');
      }
      router.refresh();
    });
  }

  return (
    <form
      id={formId}
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Entity"
          required
          value={String(form.entity)}
          onValueChange={handleEntityChange}
          options={entityOptions}
          disabled={pending}
          error={fieldErrors.entity}
        />
        <SelectField
          label="Type"
          required
          value={String(form.type)}
          onValueChange={(value) => {
            if (value) {
              patchForm({ type: Number(value) });
            }
          }}
          options={typeOptions}
          disabled={pending}
          error={fieldErrors.type}
        />
        <TextField
          label="Name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          disabled={pending}
          error={fieldErrors.name}
          className="md:col-span-2"
        />
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              Advanced options
            </Button>
          }
        />
        <CollapsibleContent className="mt-4 space-y-4">
          {form.mappers.map((mapper, index) => (
            <div key={`mapper-${index}`} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <TextField
                label="Mapper key"
                value={mapper.mapperskey}
                onChange={(value) => updateMapper(index, { mapperskey: value })}
                disabled={pending}
                error={fieldErrors[`mappers.${index}.mapperskey`]}
              />
              <TextField
                label="Mapper value"
                value={mapper.mappersvalue}
                onChange={(value) => updateMapper(index, { mappersvalue: value })}
                disabled={pending}
                error={fieldErrors[`mappers.${index}.mappersvalue`]}
              />
              <div className="flex items-end pb-1">
                {index === 0 ? (
                  <Button type="button" variant="outline" size="sm" onClick={addMapper} disabled={pending}>
                    <Plus className="mr-2 size-4" />
                    Add
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMapper(index)}
                    disabled={pending}
                  >
                    <Minus className="mr-2 size-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Field data-invalid={!!fieldErrors.text}>
        <FormLabel
          htmlFor={`${formId}-text`}
          required
          hint="HTML with mustache placeholders, e.g. {{client.displayName}}."
        >
          Text
        </FormLabel>
        <FieldContent>
          <Textarea
            id={`${formId}-text`}
            ref={textRef}
            rows={12}
            value={form.text}
            disabled={pending}
            aria-invalid={!!fieldErrors.text}
            className="font-mono text-sm"
            onChange={(event) => patchForm({ text: event.target.value })}
          />
          <FieldError>{fieldErrors.text}</FieldError>
        </FieldContent>
      </Field>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Insert parameters</h3>
        {form.entity === CLIENT_ENTITY_ID ? (
          <ParameterGroup title="Customer parameters" labels={clientParameterLabels} onInsert={insertParameter} />
        ) : null}
        {form.entity === LOAN_ENTITY_ID ? (
          <>
            <ParameterGroup title="Loan parameters" labels={loanParameterLabels} onInsert={insertParameter} />
            <ParameterGroup
              title="Repayment schedule parameters"
              labels={repaymentParameterLabels}
              onInsert={insertParameter}
            />
          </>
        ) : null}
      </div>

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create template' : 'Save changes'}
        </Button>
        <Link
          href={
            mode === 'edit' && templateId != null ? `/templates/${templateId}` : '/templates'
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function ParameterGroup({
  title,
  labels,
  onInsert
}: {
  title: string;
  labels: string[];
  onInsert: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            {title}
          </Button>
        }
      />
      <CollapsibleContent className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <Button key={label} type="button" variant="secondary" size="sm" onClick={() => onInsert(label)}>
            {label}
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
