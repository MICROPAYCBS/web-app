'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@/components/composites/text-field';
import {
  PRODUCT_SHORT_NAME_EDITABLE_HINT,
  PRODUCT_SHORT_NAME_LOCKED_HINT
} from '@/lib/fineract/product-short-name';

type ProductShortNameFieldProps = {
  id: string;
  value: string;
  onChange: (shortName: string) => void;
  error?: string;
  lockedShortName?: string;
};

export function ProductShortNameField({
  id,
  value,
  onChange,
  error,
  lockedShortName
}: ProductShortNameFieldProps) {
  const locked = lockedShortName != null;

  return (
    <TextField
      id={id}
      label="Short name"
      required
      value={value}
      onChange={onChange}
      error={error}
      disabled={locked}
      hint={
        locked
          ? PRODUCT_SHORT_NAME_LOCKED_HINT
          : `Up to 4 characters. ${PRODUCT_SHORT_NAME_EDITABLE_HINT}`
      }
    />
  );
}
