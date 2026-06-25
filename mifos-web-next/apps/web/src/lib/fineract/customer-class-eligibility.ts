/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';

function ageFromDateOfBirth(dateOfBirth: string | undefined, today = new Date()): number | undefined {
  if (!dateOfBirth?.trim()) {
    return undefined;
  }
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return undefined;
  }
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** Client-side preview of backend assignment rules (legal form and age only). */
export function filterEligibleCustomerClasses(
  classes: CustomerClass[] | undefined,
  context: {
    legalFormId?: number;
    dateOfBirth?: string;
  }
): CustomerClass[] {
  if (!classes?.length) {
    return [];
  }

  const age = ageFromDateOfBirth(context.dateOfBirth);

  return classes.filter((customerClass) => {
    if (customerClass.status && customerClass.status !== 'ACTIVE') {
      return false;
    }

    if (
      context.legalFormId != null &&
      customerClass.legalFormId != null &&
      context.legalFormId !== customerClass.legalFormId
    ) {
      return false;
    }

    if (customerClass.minAge != null || customerClass.maxAge != null) {
      if (customerClass.legalFormId === LEGAL_FORM_ENTITY) {
        return false;
      }
      if (age != null) {
        if (customerClass.minAge != null && age < customerClass.minAge) {
          return false;
        }
        if (customerClass.maxAge != null && age > customerClass.maxAge) {
          return false;
        }
      }
    }

    return true;
  });
}

export type CustomerClassFormValidationContext = {
  customerClassId?: number;
  customerClassOptions?: CustomerClass[];
  dateOfBirth?: string;
  legalFormId?: number;
};

/** Client-side checks aligned with Fineract customer class assignment rules. */
export function validateCustomerClassFormFields(
  context: CustomerClassFormValidationContext
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (context.customerClassId == null) {
    return errors;
  }

  const customerClass = context.customerClassOptions?.find(
    (row) => row.id === context.customerClassId
  );
  if (!customerClass) {
    return errors;
  }

  const classLabel = customerClass.className || customerClass.classCode || 'selected class';

  if (
    (customerClass.minAge != null || customerClass.maxAge != null) &&
    customerClass.legalFormId !== LEGAL_FORM_ENTITY &&
    !context.dateOfBirth?.trim()
  ) {
    errors.dateOfBirth = `Date of birth is required for class "${classLabel}".`;
  }

  return errors;
}

export function formatLegalFormLabel(legalFormId?: number): string | undefined {
  switch (legalFormId) {
    case LEGAL_FORM_PERSON:
      return 'Person';
    case LEGAL_FORM_ENTITY:
      return 'Entity';
    default:
      return undefined;
  }
}

export function formatCustomerClassEligibilityHint(customerClass: CustomerClass): string | undefined {
  const parts: string[] = [];
  const legalFormLabel = formatLegalFormLabel(customerClass.legalFormId);
  if (legalFormLabel) {
    parts.push(legalFormLabel);
  }
  if (customerClass.minAge != null || customerClass.maxAge != null) {
    if (customerClass.minAge != null && customerClass.maxAge != null) {
      parts.push(`Ages ${customerClass.minAge}–${customerClass.maxAge}`);
    } else if (customerClass.minAge != null) {
      parts.push(`Age ${customerClass.minAge}+`);
    } else if (customerClass.maxAge != null) {
      parts.push(`Up to age ${customerClass.maxAge}`);
    }
  }
  return parts.length ? parts.join(' · ') : undefined;
}

/** Display label for a customer's assigned class (prefers class name). */
export function formatCustomerClassLabel(
  customerClass?: Pick<CustomerClass, 'classCode' | 'className'> | null
): string | undefined {
  if (!customerClass) {
    return undefined;
  }
  if (customerClass.className?.trim()) {
    return customerClass.className.trim();
  }
  return customerClass.classCode?.trim() || undefined;
}
