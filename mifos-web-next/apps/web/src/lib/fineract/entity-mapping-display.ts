/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { EntityMappingOption } from '@mifos/api-client';
import type { ChargeListItem } from '@mifos/api-client';
import type { LoanProductListItem } from '@mifos/api-client';
import type { SavingsProductListItem } from '@mifos/api-client';

import type { FineractEntityMappingDetail } from '@mifos/api-client';
import {
  fineractApiDateToFormString,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

export function entityMappingDetailToFormValues(
  detail: FineractEntityMappingDetail,
  dateFormat: string,
  locale: string
) {
  const ctx = resolveFineractDateContext({ dateFormat, locale });
  return {
    fromId: detail.fromId,
    toId: detail.toId,
    startDate: fineractApiDateToFormString(detail.startDate, ctx),
    endDate: fineractApiDateToFormString(detail.endDate, ctx),
    dateFormat: ctx.dateFormat,
    locale: ctx.locale
  };
}

/** Global configuration flags that gate entity-to-entity mapping enforcement. */
export const ENTITY_MAPPING_GLOBAL_CONFIGS = [
  {
    name: 'office-specific-products-enabled',
    label: 'Office-specific products enabled',
    description: 'Turns on office-based restrictions for products and charges.'
  },
  {
    name: 'restrict-products-to-user-office',
    label: 'Restrict products to user office',
    description:
      'Limits which products and charges a user can access based on the mappings defined here.'
  }
] as const;

const MAPPING_TYPE_LABELS: Record<string, string> = {
  office_access_to_loan_products: 'Offices → Loan products',
  office_access_to_savings_products: 'Offices → Savings products',
  'office_access_to_fees/charges': 'Offices → Charges/fees',
  office_access_to_departments: 'Offices → Departments',
  role_access_to_loan_products: 'Roles → Loan products',
  role_access_to_savings_products: 'Roles → Savings products'
};

export function formatEntityMappingTypeLabel(mappingTypes: string): string {
  return MAPPING_TYPE_LABELS[mappingTypes] ?? mappingTypes.replaceAll('_', ' ');
}

export function entityMappingTypeNavId(type: { id: number }): string {
  return String(type.id);
}

const MAPPING_TYPE_ICON_KEYS: Record<
  string,
  'office-loan' | 'office-savings' | 'office-charge' | 'office-department' | 'role-loan' | 'role-savings'
> = {
  office_access_to_loan_products: 'office-loan',
  office_access_to_savings_products: 'office-savings',
  'office_access_to_fees/charges': 'office-charge',
  office_access_to_departments: 'office-department',
  role_access_to_loan_products: 'role-loan',
  role_access_to_savings_products: 'role-savings'
};

export function entityMappingTypeIconKey(mappingTypes: string) {
  return MAPPING_TYPE_ICON_KEYS[mappingTypes];
}

export function entityMappingFilterLabels(mappingTypes: string): {
  fromLabel: string;
  toLabel: string;
} {
  switch (mappingTypes) {
    case 'office_access_to_loan_products':
    case 'office_access_to_savings_products':
    case 'office_access_to_fees/charges':
    case 'office_access_to_departments':
      return { fromLabel: 'Office', toLabel: entityMappingToEntityLabel(mappingTypes) };
    case 'role_access_to_loan_products':
    case 'role_access_to_savings_products':
      return { fromLabel: 'Role', toLabel: entityMappingToEntityLabel(mappingTypes) };
    default:
      return { fromLabel: 'From entity', toLabel: 'To entity' };
  }
}

function entityMappingToEntityLabel(mappingTypes: string): string {
  switch (mappingTypes) {
    case 'office_access_to_loan_products':
    case 'role_access_to_loan_products':
      return 'Loan product';
    case 'office_access_to_savings_products':
    case 'role_access_to_savings_products':
      return 'Savings product';
    case 'office_access_to_fees/charges':
      return 'Charge/fee';
    case 'office_access_to_departments':
      return 'Department';
    default:
      return 'To entity';
  }
}

export function departmentMappingOptions(
  items: Array<{ id: number; departmentName: string }>
): EntityMappingOption[] {
  return items
    .map((item) => {
      const id = Number(item.id);
      const name = item.departmentName?.trim();
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is EntityMappingOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function toEntityMappingOptions(
  items: Array<{ id?: number; name?: string }>
): EntityMappingOption[] {
  return items
    .map((item) => {
      const id = Number(item.id);
      const name = item.name?.trim();
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is EntityMappingOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function loanProductOptions(items: LoanProductListItem[]): EntityMappingOption[] {
  return toEntityMappingOptions(items);
}

export function savingsProductOptions(items: SavingsProductListItem[]): EntityMappingOption[] {
  return toEntityMappingOptions(items);
}

export function chargeOptions(items: ChargeListItem[]): EntityMappingOption[] {
  return toEntityMappingOptions(items);
}

/** Global configuration flags that must be enabled for entity mappings to take effect. */
export const ENTITY_MAPPING_REQUIRED_GLOBAL_CONFIGS = [
  {
    name: 'office-specific-products-enabled',
    label: 'Office-specific products enabled',
    description:
      'Turns on office-based restrictions for loan products, savings products, and charges.'
  },
  {
    name: 'restrict-products-to-user-office',
    label: 'Restrict products to user office',
    description:
      'Applies the mappings defined here so users only see products and charges they are allowed to access.'
  }
] as const;

export function formatEntityMappingDate(value: string | number[] | undefined): string {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'string') {
    return value.trim() || '—';
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    if (
      typeof year === 'number' &&
      typeof month === 'number' &&
      typeof day === 'number'
    ) {
      return new Date(year, month - 1, day).toLocaleDateString();
    }
  }
  return '—';
}
