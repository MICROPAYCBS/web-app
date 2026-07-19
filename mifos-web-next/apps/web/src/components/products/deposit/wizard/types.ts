/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductKind, DepositProductTemplate } from '@mifos/api-client';
import type { DepositProductKindConfig } from '@/lib/fineract/deposit-product-config';
import type { UpsertDepositProductInput } from '@mifos/validation';

export type WizardMode = 'create' | 'edit';

export interface DepositProductWizardProps {
  kind: DepositProductKind;
  config: DepositProductKindConfig;
  mode: WizardMode;
  template: DepositProductTemplate;
  initialDraft: UpsertDepositProductInput;
  productId?: string;
}

export type StepErrors = Record<string, string>;

export interface DepositProductStepProps {
  config: DepositProductKindConfig;
  template: DepositProductTemplate;
  draft: UpsertDepositProductInput;
  errors: StepErrors;
}
