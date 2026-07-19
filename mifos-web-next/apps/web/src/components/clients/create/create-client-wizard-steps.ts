/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FormWizardStep } from '@/components/composites/form-wizard';

export const CREATE_CLIENT_WIZARD_START_STEPS: FormWizardStep[] = [
  { id: 'biodata', label: 'Biodata' },
  { id: 'contact', label: 'Contact' },
  { id: 'identifiers', label: 'Identification' }
];

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
