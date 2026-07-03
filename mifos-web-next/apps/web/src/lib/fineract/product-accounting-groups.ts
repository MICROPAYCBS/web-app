/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Standard GL category headings for product accounting forms and detail views. */
export const PRODUCT_ACCOUNTING_GROUP_ORDER = [
  'Assets',
  'Liabilities',
  'Equity',
  'Expenses',
  'Income'
] as const;

export type ProductAccountingGroup = (typeof PRODUCT_ACCOUNTING_GROUP_ORDER)[number];

export type ProductAccountingAccountField<TKey extends string = string> = {
  key: TKey;
  label: string;
  group: ProductAccountingGroup | string;
  required?: boolean;
  optional?: boolean;
};

export function groupProductAccountingFields<T extends { group: string }>(
  fields: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const field of fields) {
    const list = groups.get(field.group) ?? [];
    list.push(field);
    groups.set(field.group, list);
  }
  return groups;
}

export function orderedProductAccountingGroups(grouped: Map<string, unknown[]>): string[] {
  const keys = new Set(grouped.keys());
  const ordered: string[] = PRODUCT_ACCOUNTING_GROUP_ORDER.filter((group) => keys.has(group));
  const knownGroups = new Set<string>(PRODUCT_ACCOUNTING_GROUP_ORDER);
  for (const key of keys) {
    if (!knownGroups.has(key)) {
      ordered.push(key);
    }
  }
  return ordered;
}
