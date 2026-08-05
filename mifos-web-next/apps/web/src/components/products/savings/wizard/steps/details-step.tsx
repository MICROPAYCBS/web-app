'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductDetailsInput } from '@mifos/validation';
import { DateField } from '@/components/composites/date-field';
import { TextField } from '@/components/composites/text-field';
import { ProductShortNameField } from '@/components/products/shared/product-short-name-field';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import type { SavingsProductStepProps } from '../types';

export function DetailsStep({
  draft,
  errors,
  lockedShortName,
  onChange
}: SavingsProductStepProps & {
  lockedShortName?: string;
  onChange: (patch: Partial<SavingsProductDetailsInput>) => void;
}) {
  const details = draft.details;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Name and identification for this savings product.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="details.name"
          label="Name"
          required
          value={details.name}
          onChange={(name) => onChange({ name })}
          error={errors['details.name']}
        />
        <ProductShortNameField
          id="details.shortName"
          value={details.shortName}
          onChange={(shortName) => onChange({ shortName })}
          error={errors['details.shortName']}
          lockedShortName={lockedShortName}
        />
        <DateField
          id="details.startDate"
          label="Start date"
          optional
          allowFuture
          dateFormat={FINERACT_DATE_FORMAT}
          value={details.startDate ?? undefined}
          onChange={(startDate) => onChange({ startDate: startDate ?? '' })}
          error={errors['details.startDate']}
        />
        <DateField
          id="details.closeDate"
          label="Expiry date"
          optional
          allowFuture
          dateFormat={FINERACT_DATE_FORMAT}
          value={details.closeDate ?? undefined}
          onChange={(closeDate) => onChange({ closeDate: closeDate ?? '' })}
          error={errors['details.closeDate']}
        />
        <TextField
          id="details.description"
          label="Description"
          optional
          multiline
          rows={3}
          className="sm:col-span-2"
          value={details.description ?? ''}
          onChange={(description) => onChange({ description })}
          error={errors['details.description']}
        />
      </div>
    </div>
  );
}
