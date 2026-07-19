/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormPageSkeleton } from '@/components/composites/form-page-skeleton';

export default function OrganizationWorkingDaysLoading() {
  return (
    <FormPageSkeleton
      title="Working days"
      description="Define which days are working days and how repayments due on non-working days are handled."
      showBackLink={false}
      fieldCount={4}
    />
  );
}
