'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { SelectField, type SelectFieldProps } from '@/components/composites/select-field';
import {
  CUSTOMER_IDENTIFIER_CODE_NAME,
  customerIdentifierCodePath
} from '@/lib/fineract/customer-identifier-code';
import {
  codeValueSelectEmptyMessage,
  codeValueSelectHint
} from '@/lib/fineract/code-value-select';

export type CustomerIdentifierTypeSelectFieldProps = Omit<
  SelectFieldProps,
  'hint' | 'emptyMessage' | 'hintAriaLabel'
> & {
  /** When known, links directly to the Customer Identifier code values tab. */
  customerIdentifierCodeId?: number;
  /** Overrides the default lookup hint (e.g. when every type already has a rule). */
  hintOverride?: string;
};

export function CustomerIdentifierTypeSelectField({
  customerIdentifierCodeId,
  hintOverride,
  ...props
}: CustomerIdentifierTypeSelectFieldProps) {
  const codesHref = customerIdentifierCodePath(customerIdentifierCodeId);

  return (
    <div className="space-y-1">
      <SelectField
        {...props}
        hint={hintOverride ?? codeValueSelectHint(CUSTOMER_IDENTIFIER_CODE_NAME)}
        hintAriaLabel="Customer identifier type lookup code"
        emptyMessage={codeValueSelectEmptyMessage(CUSTOMER_IDENTIFIER_CODE_NAME)}
      />
      <p className="text-sm text-muted-foreground">
        Options come from the{' '}
        <span className="font-mono text-foreground">{CUSTOMER_IDENTIFIER_CODE_NAME}</span> lookup.
        To add more identifier types, open{' '}
        <Link href={codesHref} className="font-medium text-primary hover:underline">
          Administration → Codes
        </Link>
        , add values there, then return here to configure an identity type guide.
      </p>
    </div>
  );
}
