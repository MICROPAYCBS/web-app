/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductTemplate } from '@mifos/api-client';
import type { UpsertSavingsProductInput } from '@mifos/validation';

export type WizardMode = 'create' | 'edit';

export interface SavingsProductWizardProps {
  mode: WizardMode;
  template: SavingsProductTemplate;
  initialDraft: UpsertSavingsProductInput;
  productId?: string;
}

export type StepErrors = Record<string, string>;

export interface SavingsProductStepProps {
  template: SavingsProductTemplate;
  draft: UpsertSavingsProductInput;
  errors: StepErrors;
}
