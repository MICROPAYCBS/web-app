/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';

export default function EditApprovalWorkflowLoading() {
  return (
    <PlatformRouteLayout>
      <FormWizardSkeleton
        title="Edit approval workflow"
        description="Draft workflows can be fully replaced. Activate when the structure is ready."
        stepCount={5}
      />
    </PlatformRouteLayout>
  );
}
