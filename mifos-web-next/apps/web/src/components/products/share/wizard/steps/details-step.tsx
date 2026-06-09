'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductDetailsInput } from '@mifos/validation';
import { TextField } from '@/components/composites/text-field';
import type { ShareProductStepProps } from '../types';

export function DetailsStep({
  draft,
  errors,
  onChange
}: ShareProductStepProps & {
  onChange: (patch: Partial<ShareProductDetailsInput>) => void;
}) {
  const details = draft.details;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Name and identification for this share product.
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
          id="details.description"
          label="Description"
          required
          multiline
          rows={4}
          className="sm:col-span-2"
          value={details.description ?? ''}
          onChange={(description) => onChange({ description })}
          error={errors['details.description']}
        />
      </div>
    </div>
  );
}
