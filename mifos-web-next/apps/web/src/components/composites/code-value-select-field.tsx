'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SelectField, type SelectFieldProps } from '@/components/composites/select-field';
import {
  codeValueSelectEmptyMessage,
  codeValueSelectHint
} from '@/lib/fineract/code-value-select';

export type CodeValueSelectFieldProps = Omit<SelectFieldProps, 'hint' | 'emptyMessage'> & {
  /** Fineract code name (e.g. SavingsTransactionFreezeReasons). */
  codeName: string;
};

/**
 * Select for Fineract code-value lookups. Surfaces the lookup name so admins know what to
 * configure when the list is empty.
 */
export function CodeValueSelectField({ codeName, options, ...props }: CodeValueSelectFieldProps) {
  const emptyMessage = codeValueSelectEmptyMessage(codeName);

  return (
    <div className="space-y-1">
      <SelectField
        {...props}
        options={options}
        hint={codeValueSelectHint(codeName)}
        hintAriaLabel={`${props.label} lookup code`}
        emptyMessage={emptyMessage}
      />
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active values in{' '}
          <span className="font-mono text-foreground">{codeName}</span>. Add entries under{' '}
          <span className="text-foreground">Administration → Codes</span>.
        </p>
      ) : null}
    </div>
  );
}
