/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FormWizardStep } from '@/components/composites/form-wizard';
import { LEGAL_FORM_ENTITY } from '@mifos/validation';

export const CREATE_CLIENT_WIZARD_START_STEPS: FormWizardStep[] = [
  { id: 'biodata', label: 'Biodata' },
  { id: 'contact', label: 'Contact' },
  { id: 'identifiers', label: 'Identification' }
];

export const CREATE_CLIENT_KYC_STEP: FormWizardStep = {
  id: 'kyc-capture',
  label: 'Photo and signature'
};

export function insertCreateClientKycStep(
  steps: FormWizardStep[],
  includeKyc: boolean
): FormWizardStep[] {
  const withoutKyc = steps.filter((step) => step.id !== CREATE_CLIENT_KYC_STEP.id);
  if (!includeKyc) {
    return withoutKyc;
  }
  const biodataIndex = withoutKyc.findIndex((step) => step.id === 'biodata');
  if (biodataIndex < 0) {
    return [CREATE_CLIENT_KYC_STEP, ...withoutKyc];
  }
  return [
    ...withoutKyc.slice(0, biodataIndex + 1),
    CREATE_CLIENT_KYC_STEP,
    ...withoutKyc.slice(biodataIndex + 1)
  ];
}

/** Steps shown only for individual (person) customers — hidden for entity onboarding. */
export const CREATE_CLIENT_PERSON_ONLY_STEP_IDS = new Set(['family']);

export function filterCreateClientStepsForLegalForm(
  steps: FormWizardStep[],
  legalFormId: number
): FormWizardStep[] {
  if (legalFormId === LEGAL_FORM_ENTITY) {
    return steps.filter((step) => !CREATE_CLIENT_PERSON_ONLY_STEP_IDS.has(step.id));
  }
  return steps;
}

export const CREATE_CLIENT_ADDRESS_STEP: FormWizardStep = {
  id: 'address',
  label: 'Address'
};

export const CREATE_CLIENT_WIZARD_MIDDLE_STEPS: FormWizardStep[] = [
  { id: 'customer-profiling', label: 'Customer profiling' },
  { id: 'family', label: 'Next of kin' },
  { id: 'income-sources', label: 'Income sources' },
  { id: 'compliance', label: 'Compliance' }
];

export const CREATE_CLIENT_WIZARD_END_STEPS: FormWizardStep[] = [
  { id: 'general', label: 'Account opening' },
  { id: 'preview', label: 'Preview' }
];

/** Static steps for the loading skeleton (address included; datatables omitted). */
export const CREATE_CLIENT_WIZARD_SKELETON_STEPS: FormWizardStep[] = [
  ...CREATE_CLIENT_WIZARD_START_STEPS,
  CREATE_CLIENT_ADDRESS_STEP,
  ...CREATE_CLIENT_WIZARD_MIDDLE_STEPS,
  ...CREATE_CLIENT_WIZARD_END_STEPS
];
