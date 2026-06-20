'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate } from '@mifos/api-client';
import { DatatableFields } from '@/components/clients/shared/datatable-fields';
import type { StepErrors } from '../validation';

export function DatatableStep({
  datatable,
  values,
  errors,
  onChange
}: {
  datatable: FineractClientDatatableTemplate;
  values: Record<string, unknown>;
  errors: StepErrors;
  onChange: (values: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Custom fields for table <strong>{datatable.registeredTableName}</strong>. Required fields
        are marked with an asterisk.
      </p>
      <DatatableFields
        columns={datatable.columnHeaderData ?? []}
        values={values}
        errors={errors}
        onChange={onChange}
      />
    </div>
  );
}
