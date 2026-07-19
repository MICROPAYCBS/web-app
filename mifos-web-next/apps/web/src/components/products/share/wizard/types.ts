/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductTemplate } from '@mifos/api-client';
import type { UpsertShareProductInput } from '@mifos/validation';

export type WizardMode = 'create' | 'edit';

export interface ShareProductWizardProps {
  mode: WizardMode;
  template: ShareProductTemplate;
  initialDraft: UpsertShareProductInput;
  productId?: string;
}

export type StepErrors = Record<string, string>;

export interface ShareProductStepProps {
  template: ShareProductTemplate;
  draft: UpsertShareProductInput;
  errors: StepErrors;
}
