/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormWizardSkeleton } from '@/components/composites/form-wizard-skeleton';

export default function CentralBranchPaymentLoading() {
  return (
    <FormWizardSkeleton
      title="Cross-branch"
      description="Credits at one office, debits at consuming branches, cleared through inter-branch reconciliation."
      stepCount={4}
    />
  );
}
