/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';

export default function CreateApprovalWorkflowLoading() {
  return (
    <PlatformRouteLayout>
      <FormWizardSkeleton
        title="Create approval workflow"
        description="Define stages and transitions for a maker-checker task. New workflows start in draft status."
        stepCount={5}
      />
    </PlatformRouteLayout>
  );
}
