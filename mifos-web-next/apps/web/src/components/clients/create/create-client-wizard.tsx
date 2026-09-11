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
  LEGAL_FORM_ENTITY,
  LEGAL_FORM_PERSON,
  type CreateClientPayload,
  type SaveDraftClientPayload
} from '@mifos/validation';
import { resolvePermission, useCan } from '@mifos/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addClientDatatableRowAction } from '@/actions/client-datatable';
import { saveClientDraftAction, submitClientFromCreateAction } from '@/actions/clients';
import {
  customerClassKycRequirements,
  customerClassNeedsKycStep,
  persistStagedKycCaptures,
  revokeStagedKycCapture
} from '@/lib/clients/kyc-capture';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { FormWizard, type FormWizardStep } from '@/components/composites/form-wizard';
import { FormWizardFooter } from '@/components/composites/form-wizard-footer';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { formatDatatableTableTitle } from '@/lib/fineract/client-datatable-utils';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
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
import { KycCaptureStep } from './steps/kyc-capture-step';
import { PreviewStep } from './steps/preview-step';
import {
  datatablesForLegalForm,
  multiRowDatatablesForLegalForm,
  singleRowDatatablesForLegalForm
} from './datatable-payloads';
import {
  createClientIssueStepId,
  parseCreateClientPayload,
  parseSaveDraftClientPayload
} from './build-create-client-raw';
import type { CreateClientDraft, CreateClientWizardProps } from './types';
import {
  CREATE_CLIENT_ADDRESS_STEP,
  CREATE_CLIENT_WIZARD_END_STEPS,
  CREATE_CLIENT_WIZARD_MIDDLE_STEPS,
  CREATE_CLIENT_WIZARD_START_STEPS,
  filterCreateClientStepsForLegalForm,
  insertCreateClientKycStep
} from './create-client-wizard-steps';
import {
  findFirstInvalidCreateClientStep,
  findFirstInvalidSaveProgressStep,
  validateStep,
  type CreateClientValidationContext,
  type StepErrors
} from './validation';

function buildSteps(
  template: CreateClientWizardProps['initialTemplate'],
  legalFormId: number,
  includeKyc: boolean
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
  return insertCreateClientKycStep(
    filterCreateClientStepsForLegalForm(steps, legalFormId),
    includeKyc
  );
}

function emptyDraft(
  defaultOfficeId: number | undefined,
  initialSubmittedOnDate: string,
  defaultLegalFormId: number = LEGAL_FORM_PERSON
): CreateClientDraft {
  const isEntity = defaultLegalFormId === LEGAL_FORM_ENTITY;
  return {
    general: {
      officeId: defaultOfficeId,
      legalFormId: defaultLegalFormId,
      fullname: isEntity ? '' : undefined,
      clientNonPersonDetails: isEntity ? {} : undefined,
      submittedOnDate: initialSubmittedOnDate,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    },
    familyMembers: [],
    clientIdentifiers: [],
    incomeSources: [],
    contacts: [],
    complianceProfile: emptyComplianceProfile(),
    addresses: [],
    datatables: {},
    multiRowDatatables: {}
  };
}

export function CreateClientWizard({
  initialTemplate,
  defaultOfficeId,
  defaultLegalFormId = LEGAL_FORM_PERSON,
  addressFieldConfig,
  entityDatatableChecks = [],
  incomeSourceOptions,
  identifierDocumentTypes = [],
  identifierIdentityTypeOptions = [],
  contactTypeOptions = []
}: CreateClientWizardProps) {
  const router = useRouter();
  const canCreate = useCan(resolvePermission('clients.create'));
  const canCreateImage = useCan('CREATE_CLIENTIMAGE');
  const canCreateDocument = useCan('CREATE_DOCUMENT');
  const initialSubmittedOnDate = useInitialTransactionDate();
  const [template] = useState(initialTemplate);
  const [draft, setDraft] = useState<CreateClientDraft>(() =>
    emptyDraft(defaultOfficeId, initialSubmittedOnDate, defaultLegalFormId)
  );
  const [stepId, setStepId] = useState('biodata');
  const [validationAttemptedStepIds, setValidationAttemptedStepIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState<'save' | 'submit' | null>(null);

  const legalFormId = draft.general.legalFormId ?? LEGAL_FORM_PERSON;
  const selectedCustomerClass = template.customerClassOptions?.find(
    (option) => option.id === draft.general.customerClassId
  );
  const includeKycStep = customerClassNeedsKycStep(selectedCustomerClass);
  const steps = useMemo(
    () => buildSteps(template, legalFormId, includeKycStep),
    [template, legalFormId, includeKycStep]
  );
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
      identityTypeOptions: identifierIdentityTypeOptions,
      canCreateImage,
      canCreateDocument
    }),
    [mandatoryDatatableNames, identifierIdentityTypeOptions, canCreateImage, canCreateDocument]
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

      let nextPhoto = d.kycPhoto;
      let nextSignature = d.kycSignature;
      const classChanged =
        patch.customerClassId !== undefined && patch.customerClassId !== d.general.customerClassId;
      const legalFormChanged =
        patch.legalFormId != null && patch.legalFormId !== d.general.legalFormId;
      if (classChanged || legalFormChanged) {
        const nextClass = template.customerClassOptions?.find(
          (option) => option.id === nextGeneral.customerClassId
        );
        const requirements = customerClassKycRequirements(nextClass);
        if (!requirements.requirePhoto) {
          revokeStagedKycCapture(nextPhoto);
          nextPhoto = null;
        }
        if (!requirements.requireSignature) {
          revokeStagedKycCapture(nextSignature);
          nextSignature = null;
        }
      }

      return {
        ...d,
        general: nextGeneral,
        datatables: nextDatatables,
        multiRowDatatables: nextMultiRowDatatables,
        kycPhoto: nextPhoto,
        kycSignature: nextSignature
      };
    });
  }

  function buildPayload(): CreateClientPayload | null {
    const parsed = parseCreateClientPayload(draft, template, legalFormId, contactTypeOptions);
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

  function buildSaveDraftPayload(): SaveDraftClientPayload | null {
    const parsed = parseSaveDraftClientPayload(
      draft,
      template,
      legalFormId,
      contactTypeOptions
    );
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

  async function persistExtraMultiRowDatatables(clientId: string): Promise<boolean> {
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
              `Customer was saved, but a row for ${formatDatatableTableTitle(dt.registeredTableName)} could not be saved: ${rowResult.message}`,
              rowResult.fieldErrors
            )
          );
          return false;
        }
      }
    }
    return true;
  }

  async function persistStagedKyc(clientId: string): Promise<boolean> {
    const result = await persistStagedKycCaptures(clientId, {
      photo: draft.kycPhoto,
      signature: draft.kycSignature
    });
    if (!result.ok) {
      setSubmitError(result.message);
      toast.error(result.message);
      return false;
    }
    return true;
  }

  function handleSaveDraft() {
    setSubmitError(null);
    const invalidStep = findFirstInvalidSaveProgressStep(draft, template, validationContext);
    if (invalidStep) {
      markValidationAttempted(invalidStep.stepId);
      const summary = Object.values(invalidStep.errors).join(' ');
      setSubmitError(summary || 'Complete the highlighted fields before saving the draft.');
      setStepId(invalidStep.stepId);
      return;
    }
    const payload = buildSaveDraftPayload();
    if (!payload) {
      return;
    }
    startTransition(async () => {
      setPendingMode('save');
      try {
        const result = await saveClientDraftAction(payload);
        if (
          !toastCommandOutcome(result, {
            completed: 'Customer saved as draft.',
            pending: 'Customer draft sent for approval.'
          })
        ) {
          setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
          return;
        }

        if (result.clientId == null) {
          router.push('/clients');
          router.refresh();
          return;
        }

        const clientId = String(result.clientId);
        if (result.contactSeedWarning) {
          toast.message(result.contactSeedWarning);
        }
        await persistStagedKyc(clientId);
        await persistExtraMultiRowDatatables(clientId);
        router.push(`/clients/${clientId}`);
        router.refresh();
      } finally {
        setPendingMode(null);
      }
    });
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
      setSubmitError(
        summary || 'Complete the highlighted step before submitting this customer.'
      );
      setStepId(invalidStep.stepId);
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    startTransition(async () => {
      setPendingMode('submit');
      try {
        const result = await submitClientFromCreateAction(payload);
        if (!result.ok) {
          setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
          if (result.clientId != null) {
            await persistStagedKyc(String(result.clientId));
            toast.error(result.message);
            router.push(`/clients/${result.clientId}`);
            router.refresh();
          }
          return;
        }

        toastCommandOutcome(result, {
          completed: 'Customer submitted.',
          pending: 'Customer submission sent for approval.'
        });

        if (result.clientId == null) {
          router.push('/clients');
          router.refresh();
          return;
        }

        const clientId = String(result.clientId);
        if (result.contactSeedWarning) {
          toast.message(result.contactSeedWarning);
        }
        await persistStagedKyc(clientId);
        await persistExtraMultiRowDatatables(clientId);
        router.push(`/clients/${clientId}`);
        router.refresh();
      } finally {
        setPendingMode(null);
      }
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
    if (resolvedStepId === 'kyc-capture' && !includeKycStep) {
      setStepId('biodata');
    }
  }, [resolvedStepId, activeDatatable, activeMultiRowDatatable, includeKycStep]);

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
    const parsed = parseCreateClientPayload(draft, template, legalFormId, contactTypeOptions);
    if (!parsed.ok) {
      return formatZodIssuesForDisplay(parsed.issues);
    }
    return [];
  }, [steps, draft, template, validationContext, legalFormId]);

  const isPreview = resolvedStepId === 'preview';
  const showPreviewActions = isPreview && canCreate;

  return (
    <PlatformRouteLayout>
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
          secondaryLabel={showPreviewActions ? 'Save draft' : undefined}
          onSecondary={showPreviewActions ? handleSaveDraft : undefined}
          secondaryLoading={pending && pendingMode === 'save'}
          secondaryLoadingLabel="Saving…"
          primaryLabel={showPreviewActions ? 'Submit' : 'Next'}
          onPrimary={showPreviewActions ? handleSubmit : tryNext}
          primaryLoading={pending && pendingMode === 'submit'}
          primaryLoadingLabel="Submitting…"
          primaryDisabled={isPreview && !showPreviewActions}
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

      {resolvedStepId === 'kyc-capture' ? (
        <KycCaptureStep
          template={template}
          draft={draft}
          errors={stepErrors}
          canCreateImage={canCreateImage}
          canCreateDocument={canCreateDocument}
          onPhotoChange={(kycPhoto) => setDraft((d) => ({ ...d, kycPhoto }))}
          onSignatureChange={(kycSignature) => setDraft((d) => ({ ...d, kycSignature }))}
        />
      ) : null}

      {resolvedStepId === 'contact' ? (
        <ContactStep
          draft={draft}
          errors={stepErrors}
          contactTypeOptions={contactTypeOptions}
          onDraftChange={patchGeneral}
          onContactsChange={(contacts) => setDraft((d) => ({ ...d, contacts }))}
        />
      ) : null}

      {resolvedStepId === 'identifiers' ? (
        <IdentifiersStep
          documentTypes={identifierDocumentTypes}
          identityTypeOptions={identifierIdentityTypeOptions}
          draft={draft}
          errors={stepErrors}
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
          errors={stepErrors}
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
          contactTypeOptions={contactTypeOptions}
        />
      ) : null}
    </FormWizard>
    </PlatformRouteLayout>
  );
}
