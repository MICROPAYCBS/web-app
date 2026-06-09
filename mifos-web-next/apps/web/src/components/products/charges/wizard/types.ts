/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeTemplate } from '@mifos/api-client';
import type { UpsertChargeInput } from '@mifos/validation';

export type WizardMode = 'create' | 'edit';

export type ChargeWizardDraft = Partial<UpsertChargeInput> &
  Pick<UpsertChargeInput, 'active' | 'penalty'>;

export interface ChargeWizardProps {
  mode: WizardMode;
  template: ChargeTemplate;
  initialDraft: ChargeWizardDraft;
  chargeId?: string;
}

export type StepErrors = Record<string, string>;

export interface ChargeStepProps {
  mode: WizardMode;
  template: ChargeTemplate;
  draft: ChargeWizardDraft;
  errors: StepErrors;
}
