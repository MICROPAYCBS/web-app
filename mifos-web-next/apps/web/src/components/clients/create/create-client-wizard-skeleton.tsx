/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';
import { CREATE_CLIENT_WIZARD_SKELETON_STEPS } from './create-client-wizard-steps';

export function CreateClientWizardSkeleton() {
  return (
    <FormWizardSkeleton
      title="Create customer"
      description="Complete each step to register a new customer."
      steps={CREATE_CLIENT_WIZARD_SKELETON_STEPS}
      activeStepIndex={0}
      showIntro
      fieldCount={10}
    />
  );
}
