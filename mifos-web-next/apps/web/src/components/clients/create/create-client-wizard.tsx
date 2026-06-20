'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  createClientSchema,
  formatActionErrorMessage,
  LEGAL_FORM_PERSON,
  type CreateClientPayload
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { addClientDatatableRowAction } from '@/actions/client-datatable';
import { createClientAction } from '@/actions/clients';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { formatDatatableTableTitle } from '@/lib/fineract/client-datatable-utils';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';
import { mandatoryClientDatatableNames } from '@/lib/fineract/mandatory-client-datatables';
import { AddressStep } from './steps/address-step';
import { DatatableStep } from './steps/datatable-step';
import { FamilyStep } from './steps/family-step';
import { GeneralStep } from './steps/general-step';
import { MultiRowDatatableStep } from './steps/multi-row-datatable-step';
import { PreviewStep } from './steps/preview-step';
import {
  buildCreateClientDatatablePayloads,
  datatablesForLegalForm,
  multiRowDatatablesForLegalForm,
  singleRowDatatablesForLegalForm
} from './datatable-payloads';
import type { CreateClientDraft, CreateClientWizardProps } from './types';
import {
  findFirstInvalidCreateClientStep,
  validateStep,
  type CreateClientValidationContext,
  type StepErrors
} from './validation';

function buildSteps(
  template: CreateClientWizardProps['initialTemplate'],
  legalFormId: number
): FormWizardStep[] {
  const steps: FormWizardStep[] = [
    { id: 'general', label: 'General' },
    { id: 'family', label: 'Next of kin' }
  ];
  if (template.isAddressEnabled) {
    steps.push({ id: 'address', label: 'Address' });
  }
  for (const dt of singleRowDatatablesForLegalForm(template, legalFormId)) {
    steps.push({
      id: `datatable:${dt.registeredTableName}`,
      label: formatDatatableTableTitle(dt.registeredTableName)
    });
  }
  for (const dt of multiRowDatatablesForLegalForm(template, legalFormId)) {
    steps.push({
      id: `multi-row-datatable:${dt.registeredTableName}`,
      label: formatDatatableTableTitle(dt.registeredTableName)
    });
  }
  steps.push({ id: 'preview', label: 'Preview' });
  return steps;
}

function emptyDraft(): CreateClientDraft {
  return {
    general: {
      legalFormId: LEGAL_FORM_PERSON,
      submittedOnDate: toFineractDate(),
      active: false,
      addSavings: false,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    },
    familyMembers: [],
    addresses: [],
    datatables: {},
    multiRowDatatables: {}
  };
}

export function CreateClientWizard({
  initialTemplate,
  addressFieldConfig,
  entityDatatableChecks = []
}: CreateClientWizardProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [draft, setDraft] = useState<CreateClientDraft>(emptyDraft);
  const [stepId, setStepId] = useState('general');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const legalFormId = draft.general.legalFormId ?? LEGAL_FORM_PERSON;
  const steps = useMemo(() => buildSteps(template, legalFormId), [template, legalFormId]);
  const resolvedStepId = steps.some((s) => s.id === stepId) ? stepId : 'general';
  const currentIndex = steps.findIndex((s) => s.id === resolvedStepId);

  const mandatoryDatatableNames = useMemo(
    () =>
      mandatoryClientDatatableNames(entityDatatableChecks, {
        active: draft.general.active ?? false,
        savingsProductId: draft.general.savingsProductId
      }),
    [entityDatatableChecks, draft.general.active, draft.general.savingsProductId]
  );

  const validationContext = useMemo(
    (): CreateClientValidationContext => ({
      mandatoryDatatableNames
    }),
    [mandatoryDatatableNames]
  );

  const markValidationAttempted = useCallback((id: string) => {
    setValidationAttemptedStepIds((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const invalidStepIdsForRail = useMemo(() => {
    const stepIdSet = new Set(steps.map((s) => s.id));
    return [...validationAttemptedStepIds].filter((id) => {
      if (!stepIdSet.has(id) || id === 'preview') {
        return false;
      }
      return Object.keys(validateStep(id, draft, template, validationContext)).length > 0;
    });
  }, [validationAttemptedStepIds, steps, draft, template, validationContext]);

  const stepErrors = useMemo((): StepErrors => {
    if (resolvedStepId === 'preview' || !validationAttemptedStepIds.has(resolvedStepId)) {
      return {};
    }
    return validateStep(resolvedStepId, draft, template, validationContext);
  }, [validationAttemptedStepIds, resolvedStepId, draft, template, validationContext]);

  const goNext = useCallback(() => {
    const next = steps[currentIndex + 1];
    if (next) {
      setStepId(next.id);
    }
  }, [currentIndex, steps]);

  const goBack = useCallback(() => {
    const prev = steps[currentIndex - 1];
    if (prev) {
      setStepId(prev.id);
    }
  }, [currentIndex, steps]);

  const tryNext = useCallback(() => {
    if (resolvedStepId === 'preview') {
      return;
    }
    const errors = validateStep(resolvedStepId, draft, template, validationContext);
    if (Object.keys(errors).length > 0) {
      markValidationAttempted(resolvedStepId);
      return;
    }
    goNext();
  }, [resolvedStepId, draft, template, validationContext, goNext, markValidationAttempted]);

  const goToStep = useCallback(
    (targetStepId: string) => {
      const targetIndex = steps.findIndex((s) => s.id === targetStepId);
      if (targetIndex < 0 || targetIndex === currentIndex) {
        return;
      }

      if (targetIndex < currentIndex) {
        setStepId(targetStepId);
        return;
      }

      for (let i = currentIndex; i < targetIndex; i++) {
        const stepToValidate = steps[i].id;
        const errors = validateStep(stepToValidate, draft, template, validationContext);
        if (Object.keys(errors).length > 0) {
          markValidationAttempted(stepToValidate);
          setStepId(stepToValidate);
          return;
        }
      }

      setStepId(targetStepId);
    },
    [currentIndex, draft, steps, template, validationContext, markValidationAttempted]
  );

  function patchGeneral(patch: Partial<import('./types').ClientGeneralFormState>) {
    setDraft((d) => {
      const nextGeneral = { ...d.general, ...patch };
      let nextDatatables = d.datatables;
      let nextMultiRowDatatables = d.multiRowDatatables;

      if (patch.legalFormId != null && patch.legalFormId !== d.general.legalFormId) {
        const allowedNames = new Set(
          datatablesForLegalForm(template, patch.legalFormId).map(
            (datatable) => datatable.registeredTableName
          )
        );
        nextDatatables = Object.fromEntries(
          Object.entries(d.datatables).filter(([name]) => allowedNames.has(name))
        );
        nextMultiRowDatatables = Object.fromEntries(
          Object.entries(d.multiRowDatatables).filter(([name]) => allowedNames.has(name))
        );
      }

      return {
        ...d,
        general: nextGeneral,
        datatables: nextDatatables,
        multiRowDatatables: nextMultiRowDatatables
      };
    });
  }

  function buildPayload(): CreateClientPayload | null {
    const { general, familyMembers, addresses, datatables, multiRowDatatables } = draft;
    const { addSavings, ...generalFields } = general;
    void addSavings;

    const dateFormat = generalFields.dateFormat ?? FINERACT_DATE_FORMAT;
    const locale = generalFields.locale ?? FINERACT_LOCALE;
    const datatablePayloads = buildCreateClientDatatablePayloads(
      template,
      legalFormId,
      datatables,
      multiRowDatatables,
      dateFormat,
      locale
    );

    const raw = {
      ...generalFields,
      legalFormId,
      familyMembers: familyMembers.length ? familyMembers : undefined,
      address: template.isAddressEnabled && addresses.length ? addresses : undefined,
      datatables: datatablePayloads.length ? datatablePayloads : undefined
    };

    const parsed = createClientSchema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('; ');
      setSubmitError(message || 'Validation failed. Go back and fix the form.');
      return null;
    }
    return parsed.data;
  }

  function handleSubmit() {
    setSubmitError(null);
    const invalidStep = findFirstInvalidCreateClientStep(
      steps,
      draft,
      template,
      validationContext
    );
    if (invalidStep) {
      markValidationAttempted(invalidStep.stepId);
      setStepId(invalidStep.stepId);
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    startTransition(async () => {
      const result = await createClientAction(payload);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      const clientId = String(result.clientId);
      for (const dt of multiRowDatatablesForLegalForm(template, legalFormId)) {
        const rows = draft.multiRowDatatables[dt.registeredTableName] ?? [];
        for (const row of rows.slice(1)) {
          const rowResult = await addClientDatatableRowAction(
            clientId,
            dt.registeredTableName,
            row
          );
          if (!rowResult.ok) {
            setSubmitError(
              formatActionErrorMessage(
                `Customer was created, but a row for ${formatDatatableTableTitle(dt.registeredTableName)} could not be saved: ${rowResult.message}`,
                rowResult.fieldErrors
              )
            );
            router.push(`/clients/${clientId}`);
            router.refresh();
            return;
          }
        }
      }

      router.push(`/clients/${clientId}`);
      router.refresh();
    });
  }

  const activeDatatable = resolvedStepId.startsWith('datatable:')
    ? singleRowDatatablesForLegalForm(template, legalFormId).find(
        (dt) => `datatable:${dt.registeredTableName}` === resolvedStepId
      )
    : undefined;

  const activeMultiRowDatatable = resolvedStepId.startsWith('multi-row-datatable:')
    ? multiRowDatatablesForLegalForm(template, legalFormId).find(
        (dt) => `multi-row-datatable:${dt.registeredTableName}` === resolvedStepId
      )
    : undefined;

  useEffect(() => {
    if (resolvedStepId.startsWith('datatable:') && !activeDatatable) {
      setStepId('general');
    }
    if (resolvedStepId.startsWith('multi-row-datatable:') && !activeMultiRowDatatable) {
      setStepId('general');
    }
  }, [resolvedStepId, activeDatatable, activeMultiRowDatatable]);

  const isPreview = resolvedStepId === 'preview';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FormWizard
      steps={steps}
      currentStepId={resolvedStepId}
      title="Create customer"
      description="Complete each step to register a new customer."
      onStepClick={goToStep}
      invalidStepIds={invalidStepIdsForRail}
      footer={
        <FormWizardFooter
          cancelHref="/clients"
          showBack={currentIndex > 0}
          onBack={goBack}
          backDisabled={pending}
          primaryLabel={isPreview ? 'Create customer' : 'Next'}
          onPrimary={isPreview ? handleSubmit : tryNext}
          primaryLoading={isPreview && pending}
          primaryLoadingLabel="Creating…"
        />
      }
    >
      {resolvedStepId === 'general' ? (
        <GeneralStep
          template={template}
          draft={draft}
          errors={stepErrors}
          onDraftChange={patchGeneral}
          onTemplateChange={setTemplate}
        />
      ) : null}

      {resolvedStepId === 'family' ? (
        <FamilyStep
          template={template}
          draft={draft}
          onFamilyChange={(familyMembers) => setDraft((d) => ({ ...d, familyMembers }))}
        />
      ) : null}

      {resolvedStepId === 'address' && template.isAddressEnabled ? (
        <AddressStep
          template={template}
          fieldConfig={addressFieldConfig}
          draft={draft}
          errors={stepErrors}
          onAddressesChange={(addresses) => setDraft((d) => ({ ...d, addresses }))}
        />
      ) : null}

      {activeDatatable ? (
        <DatatableStep
          datatable={activeDatatable}
          values={draft.datatables[activeDatatable.registeredTableName] ?? {}}
          errors={stepErrors}
          onChange={(values) =>
            setDraft((d) => ({
              ...d,
              datatables: {
                ...d.datatables,
                [activeDatatable.registeredTableName]: values
              }
            }))
          }
        />
      ) : null}

      {activeMultiRowDatatable ? (
        <MultiRowDatatableStep
          datatable={activeMultiRowDatatable}
          rows={draft.multiRowDatatables[activeMultiRowDatatable.registeredTableName] ?? []}
          errors={stepErrors}
          required={mandatoryDatatableNames.has(activeMultiRowDatatable.registeredTableName)}
          onChange={(rows) =>
            setDraft((d) => ({
              ...d,
              multiRowDatatables: {
                ...d.multiRowDatatables,
                [activeMultiRowDatatable.registeredTableName]: rows
              }
            }))
          }
        />
      ) : null}

      {isPreview ? (
        <PreviewStep template={template} draft={draft} submitError={submitError} />
      ) : null}
    </FormWizard>
    </div>
  );
}
