'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  formatActionErrorMessage,
  formatZodIssuesForDisplay,
  formatZodIssuesMessage,
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
import { IdentifiersStep } from './steps/identifiers-step';
import { IncomeSourceStep } from './steps/income-source-step';
import { BiodataStep } from './steps/biodata-step';
import { ContactStep } from './steps/contact-step';
import { CustomerProfilingStep } from './steps/customer-profiling-step';
import {
  ComplianceProfileStep,
  emptyComplianceProfile
} from './steps/compliance-profile-step';
import { GeneralStep } from './steps/general-step';
import { MultiRowDatatableStep } from './steps/multi-row-datatable-step';
import { PreviewStep } from './steps/preview-step';
import {
  datatablesForLegalForm,
  multiRowDatatablesForLegalForm,
  singleRowDatatablesForLegalForm
} from './datatable-payloads';
import { createClientIssueStepId, parseCreateClientPayload } from './build-create-client-raw';
import type { CreateClientDraft, CreateClientWizardProps } from './types';
import {
  CREATE_CLIENT_ADDRESS_STEP,
  CREATE_CLIENT_WIZARD_END_STEPS,
  CREATE_CLIENT_WIZARD_MIDDLE_STEPS,
  CREATE_CLIENT_WIZARD_START_STEPS
} from './create-client-wizard-steps';
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
  const steps: FormWizardStep[] = [...CREATE_CLIENT_WIZARD_START_STEPS];
  if (template.isAddressEnabled) {
    steps.push(CREATE_CLIENT_ADDRESS_STEP);
  }
  steps.push(...CREATE_CLIENT_WIZARD_MIDDLE_STEPS);
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
  steps.push(...CREATE_CLIENT_WIZARD_END_STEPS);
  return steps;
}

function emptyDraft(defaultOfficeId?: number): CreateClientDraft {
  return {
    general: {
      officeId: defaultOfficeId,
      legalFormId: LEGAL_FORM_PERSON,
      submittedOnDate: toFineractDate(),
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    },
    familyMembers: [],
    clientIdentifiers: [],
    incomeSources: [],
    complianceProfile: emptyComplianceProfile(),
    addresses: [],
    datatables: {},
    multiRowDatatables: {}
  };
}

export function CreateClientWizard({
  initialTemplate,
  defaultOfficeId,
  addressFieldConfig,
  entityDatatableChecks = [],
  incomeSourceOptions,
  identifierDocumentTypes = []
}: CreateClientWizardProps) {
  const router = useRouter();
  const [template] = useState(initialTemplate);
  const [draft, setDraft] = useState<CreateClientDraft>(() => emptyDraft(defaultOfficeId));
  const [stepId, setStepId] = useState('biodata');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const legalFormId = draft.general.legalFormId ?? LEGAL_FORM_PERSON;
  const steps = useMemo(() => buildSteps(template, legalFormId), [template, legalFormId]);
  const resolvedStepId = steps.some((s) => s.id === stepId) ? stepId : 'biodata';
  const currentIndex = steps.findIndex((s) => s.id === resolvedStepId);

  const mandatoryDatatableNames = useMemo(
    () =>
      mandatoryClientDatatableNames(entityDatatableChecks, {
        active: false,
        savingsProductId: draft.general.savingsProductId
      }),
    [entityDatatableChecks, draft.general.savingsProductId]
  );

  const validationContext = useMemo(
    (): CreateClientValidationContext => ({
      mandatoryDatatableNames,
      firstDocumentTypeId: identifierDocumentTypes[0]?.id
    }),
    [mandatoryDatatableNames, identifierDocumentTypes]
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
    const parsed = parseCreateClientPayload(draft, template, legalFormId);
    if (!parsed.ok) {
      const message = formatZodIssuesMessage(parsed.issues);
      setSubmitError(message);
      const firstIssue = parsed.issues[0];
      if (firstIssue) {
        const targetStep = createClientIssueStepId(firstIssue.path);
        if (steps.some((step) => step.id === targetStep)) {
          markValidationAttempted(targetStep);
          setStepId(targetStep);
        }
      }
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
      const summary = Object.values(invalidStep.errors).join(' ');
      setSubmitError(summary || 'Complete the highlighted step before creating this customer.');
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
      setStepId('biodata');
    }
    if (resolvedStepId.startsWith('multi-row-datatable:') && !activeMultiRowDatatable) {
      setStepId('biodata');
    }
  }, [resolvedStepId, activeDatatable, activeMultiRowDatatable]);

  const previewValidationIssues = useMemo((): string[] => {
    const invalidStep = findFirstInvalidCreateClientStep(
      steps,
      draft,
      template,
      validationContext
    );
    if (invalidStep) {
      return Object.values(invalidStep.errors);
    }
    const parsed = parseCreateClientPayload(draft, template, legalFormId);
    if (!parsed.ok) {
      return formatZodIssuesForDisplay(parsed.issues);
    }
    return [];
  }, [steps, draft, template, validationContext, legalFormId]);

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
      {resolvedStepId === 'biodata' ? (
        <BiodataStep
          template={template}
          draft={draft}
          errors={stepErrors}
          onDraftChange={patchGeneral}
        />
      ) : null}

      {resolvedStepId === 'contact' ? (
        <ContactStep draft={draft} errors={stepErrors} onDraftChange={patchGeneral} />
      ) : null}

      {resolvedStepId === 'identifiers' ? (
        <IdentifiersStep
          documentTypes={identifierDocumentTypes}
          draft={draft}
          onIdentifiersChange={(clientIdentifiers) =>
            setDraft((d) => ({ ...d, clientIdentifiers }))
          }
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

      {resolvedStepId === 'customer-profiling' ? (
        <CustomerProfilingStep
          template={template}
          draft={draft}
          errors={stepErrors}
          onDraftChange={patchGeneral}
        />
      ) : null}

      {resolvedStepId === 'family' ? (
        <FamilyStep
          template={template}
          draft={draft}
          onFamilyChange={(familyMembers) => setDraft((d) => ({ ...d, familyMembers }))}
        />
      ) : null}

      {resolvedStepId === 'income-sources' ? (
        <IncomeSourceStep
          incomeSourceOptions={incomeSourceOptions}
          draft={draft}
          onIncomeSourcesChange={(incomeSources) => setDraft((d) => ({ ...d, incomeSources }))}
        />
      ) : null}

      {resolvedStepId === 'compliance' ? (
        <ComplianceProfileStep
          draft={draft}
          errors={stepErrors}
          onComplianceChange={(complianceProfile) =>
            setDraft((d) => ({ ...d, complianceProfile }))
          }
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

      {resolvedStepId === 'general' ? (
        <GeneralStep
          template={template}
          draft={draft}
          errors={stepErrors}
          onDraftChange={patchGeneral}
        />
      ) : null}

      {isPreview ? (
        <PreviewStep
          template={template}
          draft={draft}
          submitError={submitError}
          validationIssues={previewValidationIssues}
          incomeSourceOptions={incomeSourceOptions}
          identifierDocumentTypes={identifierDocumentTypes}
        />
      ) : null}
    </FormWizard>
    </div>
  );
}
