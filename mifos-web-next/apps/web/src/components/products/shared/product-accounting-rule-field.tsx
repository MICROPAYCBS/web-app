'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';
import { useEffect } from 'react';
import {
  accountingRuleLabel,
  resolveSelectableAccountingRuleId,
  selectableAccountingRuleOptions
} from '@/lib/fineract/product-display';
import { cn } from '@/lib/utils';

export interface ProductAccountingRuleFieldProps {
  options: FineractEnumOption[];
  value: number | undefined;
  onChange: (id: number) => void;
  error?: string;
  idPrefix?: string;
  name?: string;
}

export function ProductAccountingRuleField({
  options,
  value,
  onChange,
  error,
  idPrefix = 'accounting-rule',
  name = 'accountingRule'
}: ProductAccountingRuleFieldProps) {
  const ruleOptions = selectableAccountingRuleOptions(options);
  const selectedId = resolveSelectableAccountingRuleId(value, options);

  useEffect(() => {
    if (value !== selectedId) {
      onChange(selectedId);
    }
  }, [value, selectedId, onChange]);

  return (
    <>
      <fieldset>
        <legend className="sr-only">Accounting rule</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {ruleOptions.map((option) => {
            const id = option.id ?? 0;
            const selected = selectedId === id;
            return (
              <label
                key={id}
                htmlFor={`${idPrefix}-${id}`}
                className={cn(
                  'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors sm:min-w-[10rem]',
                  selected ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/40'
                )}
              >
                <input
                  id={`${idPrefix}-${id}`}
                  type="radio"
                  name={name}
                  className="size-4 shrink-0 accent-primary"
                  checked={selected}
                  onChange={() => onChange(id)}
                />
                <span>{accountingRuleLabel(option)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  );
}
