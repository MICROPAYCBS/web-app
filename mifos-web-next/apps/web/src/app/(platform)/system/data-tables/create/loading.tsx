/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SystemDatatableFormSkeleton } from '@/components/system/system-datatable-form-skeleton';

export default function SystemDataTableCreateLoading() {
  return (
    <SystemDatatableFormSkeleton
      title="Create data table"
      description="Register a new custom field table and attach it to an entity."
    />
  );
}
