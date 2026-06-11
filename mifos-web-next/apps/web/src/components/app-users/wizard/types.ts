/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserDetail, FineractUserTemplate } from '@mifos/api-client';

export type UserWizardMode = 'create' | 'edit';

export type UserWizardDraft = {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  sendPasswordToEmail: boolean;
  passwordNeverExpires: boolean;
  password: string;
  repeatPassword: string;
  officeId: string;
  staffId: string;
  roles: number[];
};

export type StepErrors = Record<string, string>;

export interface UserWizardProps {
  mode: UserWizardMode;
  template: FineractUserTemplate;
  initialDraft: UserWizardDraft;
  userId?: number;
}

export interface UserStepProps {
  mode: UserWizardMode;
  template: FineractUserTemplate;
  draft: UserWizardDraft;
  errors: StepErrors;
}
