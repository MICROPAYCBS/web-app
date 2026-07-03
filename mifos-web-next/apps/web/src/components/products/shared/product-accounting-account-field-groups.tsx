'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import type { SelectOption } from '@/components/composites/select-field';
import {
  groupProductAccountingFields,
  orderedProductAccountingGroups,
  type ProductAccountingAccountField
} from '@/lib/fineract/product-accounting-groups';

export function ProductAccountingAccountFieldGroups<
  TKey extends string,
  TField extends ProductAccountingAccountField<TKey> = ProductAccountingAccountField<TKey>
>({
  fields,
  getValue,
  errors,
  errorPrefix = 'accounting.',
  idPrefix = 'accounting.',
  getOptions,
  onValueChange,
  footer
}: {
  fields: TField[];
  getValue: (key: TKey) => number | undefined;
  errors: Record<string, string | undefined>;
  errorPrefix?: string;
  idPrefix?: string;
  getOptions: (field: TField) => SelectOption[];
  onValueChange: (key: TKey, value: string | undefined) => void;
  footer?: ReactNode;
}) {
  const grouped = groupProductAccountingFields(fields);
  const groupOrder = orderedProductAccountingGroups(grouped);

  return (
    <div className="space-y-6">
      {groupOrder.map((group) => {
        const groupFields = grouped.get(group);
        if (!groupFields?.length) {
          return null;
        }

        return (
          <DetailSection key={group} title={group}>
            <div className="grid gap-4 sm:grid-cols-2">
              {groupFields.map((field) => {
                const value = getValue(field.key);
                return (
                  <SelectField
                    key={field.key}
                    id={`${idPrefix}${field.key}`}
                    label={field.label}
                    required={field.required ?? !field.optional}
                    optional={field.optional}
                    value={value != null ? String(value) : undefined}
                    onValueChange={(next) => onValueChange(field.key, next)}
                    options={getOptions(field)}
                    error={errors[`${errorPrefix}${field.key}`]}
                  />
                );
              })}
            </div>
          </DetailSection>
        );
      })}
      {footer}
    </div>
  );
}
