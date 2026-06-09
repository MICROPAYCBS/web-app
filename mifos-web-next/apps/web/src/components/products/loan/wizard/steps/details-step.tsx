'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductDetailsInput } from '@mifos/validation';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanProductStepProps } from '../types';

export function DetailsStep({
  template,
  draft,
  errors,
  onChange
}: LoanProductStepProps & {
  onChange: (patch: Partial<LoanProductDetailsInput>) => void;
}) {
  const details = draft.details;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Name and identification for this loan product.
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
        <TextField
          id="details.shortName"
          label="Short name"
          required
          value={details.shortName}
          onChange={(shortName) => onChange({ shortName })}
          error={errors['details.shortName']}
          hint="Up to 4 characters."
        />
        <TextField
          id="details.externalId"
          label="External ID"
          optional
          value={details.externalId ?? ''}
          onChange={(externalId) => onChange({ externalId })}
          error={errors['details.externalId']}
        />
        <SelectField
          id="details.fundId"
          label="Fund"
          optional
          value={details.fundId ? String(details.fundId) : undefined}
          onValueChange={(value) =>
            onChange({ fundId: value ? Number(value) : undefined })
          }
          options={toSelectOptions(template.fundOptions)}
          error={errors['details.fundId']}
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
        <SwitchField
          id="details.includeInBorrowerCycle"
          label="Include in customer loan counter"
          checked={details.includeInBorrowerCycle ?? false}
          onCheckedChange={(includeInBorrowerCycle) =>
            onChange({ includeInBorrowerCycle })
          }
          error={errors['details.includeInBorrowerCycle']}
        />
      </div>
    </div>
  );
}
