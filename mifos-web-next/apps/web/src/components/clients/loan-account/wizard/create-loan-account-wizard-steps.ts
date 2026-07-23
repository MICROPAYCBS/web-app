/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FormWizardStep } from '@/components/composites/form-wizard';

/** Step rail labels for the apply/modify loan wizard loading skeleton. */
export const CREATE_LOAN_ACCOUNT_WIZARD_SKELETON_STEPS: FormWizardStep[] = [
  { id: 'core', label: 'Product' },
  { id: 'financial', label: 'Terms' },
  { id: 'timeline', label: 'Interest' },
  { id: 'charges', label: 'Charges' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'security', label: 'Security' },
  { id: 'payout', label: 'Payout' },
  { id: 'preview', label: 'Preview' }
];
