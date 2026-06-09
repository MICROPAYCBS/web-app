/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDatatableCheckTemplate } from '@mifos/api-client';
import type { EntityDatatableCheckEntity } from '@mifos/validation';
import type { SelectOption } from '@/components/composites/select-field';
import { formatApplicationTableLabel } from '@/lib/fineract/system-datatables-display';

export const ENTITY_CHECK_ENTITY_OPTIONS: SelectOption[] = [
  { value: 'm_client', label: 'Client' },
  { value: 'm_loan', label: 'Loan account' },
  { value: 'm_group', label: 'Group' },
  { value: 'm_savings_account', label: 'Savings account' }
];

export function formatEntityCheckEntity(entity: string): string {
  return formatApplicationTableLabel(entity) !== '—'
    ? formatApplicationTableLabel(entity)
    : entity;
}

export function statusOptionsForEntity(
  template: FineractEntityDatatableCheckTemplate,
  entity: EntityDatatableCheckEntity | undefined
): SelectOption[] {
  if (!entity) {
    return [];
  }
  let options: { name: string; code: number }[] = [];
  switch (entity) {
    case 'm_client':
      options = template.statusClient ?? [];
      break;
    case 'm_loan':
      options = template.statusLoans ?? [];
      break;
    case 'm_group':
      options = template.statusGroup ?? [];
      break;
    case 'm_savings_account':
      options = template.statusSavings ?? [];
      break;
  }
  return options.map((option) => ({
    value: String(option.code),
    label: option.name
  }));
}

export function datatableOptionsForEntity(
  template: FineractEntityDatatableCheckTemplate,
  entity: EntityDatatableCheckEntity | undefined
): SelectOption[] {
  if (!entity) {
    return [];
  }
  return (template.datatables ?? [])
    .filter((row) => row.entity === entity)
    .map((row) => ({
      value: row.dataTableName,
      label: row.dataTableName
    }));
}

export function productOptionsForEntity(
  template: FineractEntityDatatableCheckTemplate,
  entity: EntityDatatableCheckEntity | undefined
): SelectOption[] {
  if (entity === 'm_loan') {
    return (template.loanProductDatas ?? []).map((product) => ({
      value: String(product.id),
      label: product.name
    }));
  }
  if (entity === 'm_savings_account') {
    return (template.savingsProductDatas ?? []).map((product) => ({
      value: String(product.id),
      label: product.name
    }));
  }
  return [];
}

export function entityRequiresProduct(entity: EntityDatatableCheckEntity | undefined): boolean {
  return entity === 'm_loan' || entity === 'm_savings_account';
}
