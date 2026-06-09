/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind, LoanProductTemplate } from '@mifos/api-client';
import type { UpsertLoanProductInput } from '@mifos/validation';

export type WizardMode = 'create' | 'edit';

export interface LoanProductWizardProps {
  mode: WizardMode;
  productKind: LoanProductKind;
  template: LoanProductTemplate;
  initialDraft: UpsertLoanProductInput;
  productId?: string;
}

export type StepErrors = Record<string, string>;

export interface LoanProductStepProps {
  template: LoanProductTemplate;
  draft: UpsertLoanProductInput;
  errors: StepErrors;
}
