/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormPageSkeleton } from '@/components/composites/form-page-skeleton';

export default function BusinessDateLoading() {
  return (
    <FormPageSkeleton
      title="Business date"
      description="View and adjust the organisation business date and close-of-business date when enabled."
    />
  );
}
