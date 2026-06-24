/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';

const LOW_RISK_PROFILES = new Set(['very low', 'low']);
const MEDIUM_RISK_PROFILES = new Set(['medium']);
const HIGH_RISK_PROFILES = new Set(['high', 'very high']);

type RiskProfileOption = { id: number; name?: string; value?: string };

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

export function resolveCustomerRiskProfileLabel(
  customerRiskProfileId: number | undefined,
  customerRiskProfileOptions?: RiskProfileOption[],
  assignedCustomerRiskProfile?: RiskProfileOption | null
): string | undefined {
  const fromOptions = customerRiskProfileOptions?.find(
    (option) => option.id === customerRiskProfileId
  );
  if (fromOptions?.name?.trim()) {
    return fromOptions.name;
  }
  if (fromOptions?.value?.trim()) {
    return fromOptions.value;
  }
  if (
    assignedCustomerRiskProfile &&
    (assignedCustomerRiskProfile.id == null ||
      assignedCustomerRiskProfile.id === customerRiskProfileId)
  ) {
    if (assignedCustomerRiskProfile.name?.trim()) {
      return assignedCustomerRiskProfile.name;
    }
    if (assignedCustomerRiskProfile.value?.trim()) {
      return assignedCustomerRiskProfile.value;
    }
  }
  return undefined;
}

function riskProfileMatchesClass(
  riskProfileLabel: string | undefined,
  classRiskLevel: string | undefined
): boolean {
  if (!classRiskLevel?.trim()) {
    return true;
  }
  if (!riskProfileLabel?.trim()) {
    // Fineract requires a risk profile before assignment; keep options visible until one is set.
    return true;
  }
  const normalized = riskProfileLabel.trim().toLowerCase();
  switch (classRiskLevel.toUpperCase()) {
    case 'LOW':
      return LOW_RISK_PROFILES.has(normalized);
    case 'MEDIUM':
      return MEDIUM_RISK_PROFILES.has(normalized);
    case 'HIGH':
      return HIGH_RISK_PROFILES.has(normalized);
    default:
      return true;
  }
}

/** Client-side preview of backend assignment rules (age, legal form, risk profile). */
export function filterEligibleCustomerClasses(
  classes: CustomerClass[] | undefined,
  context: {
    legalFormId?: number;
    dateOfBirth?: string;
    customerRiskProfileId?: number;
    customerRiskProfileOptions?: RiskProfileOption[];
    assignedCustomerRiskProfile?: RiskProfileOption | null;
    groupCount?: number;
  }
): CustomerClass[] {
  if (!classes?.length) {
    return [];
  }

  const age = ageFromDateOfBirth(context.dateOfBirth);
  const riskProfileLabel = resolveCustomerRiskProfileLabel(
    context.customerRiskProfileId,
    context.customerRiskProfileOptions,
    context.assignedCustomerRiskProfile
  );

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

    const customerType = customerClass.customerType?.toUpperCase();
    if (customerType === 'JOINT') {
      return false;
    }
    if (customerType === 'GROUP' && (context.groupCount ?? 0) === 0) {
      return false;
    }

    if (!riskProfileMatchesClass(riskProfileLabel, customerClass.riskLevel)) {
      return false;
    }

    return true;
  });
}

export type CustomerClassFormValidationContext = {
  customerClassId?: number;
  customerClassOptions?: CustomerClass[];
  customerRiskProfileId?: number;
  customerRiskProfileOptions?: RiskProfileOption[];
  assignedCustomerRiskProfile?: RiskProfileOption | null;
  dateOfBirth?: string;
  legalFormId?: number;
  groupCount?: number;
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

  if (customerClass.riskLevel?.trim() && context.customerRiskProfileId == null) {
    errors.customerRiskProfileId = `Select a customer risk profile for class "${classLabel}".`;
  }

  const riskProfileLabel = resolveCustomerRiskProfileLabel(
    context.customerRiskProfileId,
    context.customerRiskProfileOptions,
    context.assignedCustomerRiskProfile
  );
  if (
    customerClass.riskLevel?.trim() &&
    context.customerRiskProfileId != null &&
    !riskProfileMatchesClass(riskProfileLabel, customerClass.riskLevel)
  ) {
    errors.customerRiskProfileId = `Risk profile does not match the ${customerClass.riskLevel.toLowerCase()} risk level required by class "${classLabel}".`;
  }

  if (
    (customerClass.minAge != null || customerClass.maxAge != null) &&
    customerClass.legalFormId !== LEGAL_FORM_ENTITY &&
    !context.dateOfBirth?.trim()
  ) {
    errors.dateOfBirth = `Date of birth is required for class "${classLabel}".`;
  }

  const customerType = customerClass.customerType?.toUpperCase();
  if (customerType === 'GROUP' && (context.groupCount ?? 0) === 0) {
    errors.customerClassId = `Class "${classLabel}" requires the customer to belong to a group.`;
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
  if (customerClass.customerType) {
    parts.push(customerClass.customerType);
  }
  if (customerClass.riskLevel) {
    parts.push(`${customerClass.riskLevel} risk`);
  }
  if (customerClass.kycLevel) {
    parts.push(`${customerClass.kycLevel} KYC`);
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
