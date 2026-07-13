/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass, FineractEnumOption } from '@mifos/api-client';
import { translateFineractCode } from '@mifos/i18n';
import {
  isComplianceProfileEmpty,
  LEGAL_FORM_ENTITY,
  LEGAL_FORM_PERSON,
  type ComplianceProfileInput
} from '@mifos/validation';

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
  customerClass?: Pick<CustomerClass, 'classCode' | 'className' | 'id'> | null
): string | undefined {
  if (!customerClass) {
    return undefined;
  }
  if (customerClass.className?.trim()) {
    return customerClass.className.trim();
  }
  if (customerClass.classCode?.trim()) {
    return customerClass.classCode.trim();
  }
  if (customerClass.id != null) {
    return `Class ${customerClass.id}`;
  }
  return undefined;
}

export function resolveClientCustomerClassId(
  client: Pick<{ customerClassId?: number; customerClass?: { id?: number } | null }, 'customerClassId' | 'customerClass'>
): number | undefined {
  const raw = client.customerClassId ?? client.customerClass?.id;
  const id = raw != null ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

export function isCustomerClassAssigned(
  client: Pick<{ customerClassId?: number; customerClass?: { id?: number } | null }, 'customerClassId' | 'customerClass'>
): boolean {
  return resolveClientCustomerClassId(client) != null;
}

export function customerClassMissingActivationIssue(): CustomerClassActivationIssue {
  return {
    code: 'validation.msg.client.customerClassId.required',
    message: translateFineractCode(
      'validation.msg.client.customerClassId.required',
      'Assign a customer class before you can activate this customer.'
    ),
    hint: 'Open Edit on the customer profile, choose Customer class, save your changes, then return here to activate.',
    action: 'edit-customer'
  };
}

export type CustomerClassActivationClientState = {
  legalFormId?: number;
  dateOfBirth?: string;
  customerRiskProfile?: FineractEnumOption | null;
  hasProfileImage?: boolean;
  hasSignature?: boolean;
  identifierCount?: number;
  complianceProfile?: ComplianceProfileInput | null;
};

export type ClientActivationBlockerAction =
  | 'edit-customer'
  | 'manage-identifiers'
  | 'compliance-profile';

export type CustomerClassActivationIssue = {
  code: string;
  message: string;
  hint?: string;
  action?: ClientActivationBlockerAction;
};

function customerClassLabelForMessage(customerClass: CustomerClass): string {
  return formatCustomerClassLabel(customerClass) ?? 'assigned customer class';
}

function customerRiskProfileLevel(profile?: FineractEnumOption | null): string | undefined {
  const code = profile?.code?.trim();
  if (code) {
    return code;
  }
  const name = profile?.name?.trim();
  if (name) {
    return name;
  }
  return profile?.value?.trim() || undefined;
}

function riskLevelsMatch(classLevel: string, profileLevel: string): boolean {
  const normalizedClass = classLevel.trim().toUpperCase();
  const normalizedProfile = profileLevel.trim().toUpperCase();
  if (normalizedClass === normalizedProfile) {
    return true;
  }
  return normalizedProfile.includes(normalizedClass);
}

function activationMessage(code: string, fallback: string): string {
  return translateFineractCode(code, fallback);
}

/** Checks aligned with Fineract customer class rules before activation. */
export function getCustomerClassActivationIssues(
  customerClass: CustomerClass | undefined,
  client: CustomerClassActivationClientState
): CustomerClassActivationIssue[] {
  if (!customerClass) {
    return [];
  }

  const issues: CustomerClassActivationIssue[] = [];
  const classLabel = customerClassLabelForMessage(customerClass);

  if (customerClass.enforceCustPhoto && !client.hasProfileImage) {
    issues.push({
      code: 'validation.msg.client.customerClassId.photo.required',
      message: activationMessage(
        'validation.msg.client.customerClassId.photo.required',
        'A profile photo is required for the assigned customer class.'
      )
    });
  }

  if (customerClass.enforceCustSignature && !client.hasSignature) {
    issues.push({
      code: 'validation.msg.client.customerClassId.signature.required',
      message: activationMessage(
        'validation.msg.client.customerClassId.signature.required',
        'A customer signature is required for the assigned customer class.'
      )
    });
  }

  if (customerClass.enforceCustDocument && (client.identifierCount ?? 0) < 1) {
    issues.push({
      code: 'validation.msg.client.customerClassId.document.required',
      message: activationMessage(
        'validation.msg.client.customerClassId.document.required',
        'At least one identification document is required for the assigned customer class.'
      )
    });
  }

  if (
    customerClass.legalFormId != null &&
    client.legalFormId != null &&
    customerClass.legalFormId !== client.legalFormId
  ) {
    issues.push({
      code: 'validation.msg.client.customerClassId.legalForm.mismatch',
      message: activationMessage(
        'validation.msg.client.customerClassId.legalForm.mismatch',
        "The customer's legal form does not match the assigned customer class."
      )
    });
  }

  if (
    (customerClass.minAge != null || customerClass.maxAge != null) &&
    customerClass.legalFormId !== LEGAL_FORM_ENTITY &&
    !client.dateOfBirth?.trim()
  ) {
    issues.push({
      code: 'validation.msg.client.customerClassId.dateOfBirth.required',
      message: activationMessage(
        'validation.msg.client.customerClassId.dateOfBirth.required',
        'Date of birth is required for the assigned customer class.'
      )
    });
  }

  const age = ageFromDateOfBirth(client.dateOfBirth);
  if (
    age != null &&
    customerClass.legalFormId !== LEGAL_FORM_ENTITY &&
    (customerClass.minAge != null || customerClass.maxAge != null)
  ) {
    if (customerClass.minAge != null && age < customerClass.minAge) {
      issues.push({
        code: 'validation.msg.client.customerClass.requirements.not.met',
        message: `Customer age is below the minimum (${customerClass.minAge}) for class "${classLabel}".`
      });
    }
    if (customerClass.maxAge != null && age > customerClass.maxAge) {
      issues.push({
        code: 'validation.msg.client.customerClass.requirements.not.met',
        message: `Customer age exceeds the maximum (${customerClass.maxAge}) for class "${classLabel}".`
      });
    }
  }

  const classRiskLevel = customerClass.riskLevel?.trim();
  if (classRiskLevel) {
    if (!client.customerRiskProfile?.id) {
      issues.push({
        code: 'validation.msg.client.customerClassId.riskProfile.required',
        message: activationMessage(
          'validation.msg.client.customerClassId.riskProfile.required',
          'Select a customer risk profile for the assigned customer class.'
        )
      });
    } else {
      const profileLevel = customerRiskProfileLevel(client.customerRiskProfile);
      if (profileLevel && !riskLevelsMatch(classRiskLevel, profileLevel)) {
        issues.push({
          code: 'validation.msg.client.customerClassId.riskLevel.mismatch',
          message: activationMessage(
            'validation.msg.client.customerClassId.riskLevel.mismatch',
            "The customer's risk profile does not match the assigned customer class risk level."
          )
        });
      }
    }
  }

  if (customerClass.enhancedDueDiligence) {
    const profile = client.complianceProfile;
    if (isComplianceProfileEmpty(profile ?? undefined)) {
      issues.push({
        code: 'validation.msg.client.customerClassId.edd.profile.required',
        message: activationMessage(
          'validation.msg.client.customerClassId.edd.profile.required',
          'A compliance profile is required for the assigned customer class.'
        )
      });
    } else if (profile?.isPep && !profile.pepPosition?.trim()) {
      issues.push({
        code: 'validation.msg.client.customerClassId.edd.pep.incomplete',
        message: activationMessage(
          'validation.msg.client.customerClassId.edd.pep.incomplete',
          'PEP details on the compliance profile are incomplete for the assigned customer class.'
        )
      });
    } else if (profile?.usCitizenOrResident && !profile.fatcaRegistered) {
      issues.push({
        code: 'validation.msg.client.customerClassId.edd.fatca.required',
        message: activationMessage(
          'validation.msg.client.customerClassId.edd.fatca.required',
          'FATCA registration is required on the compliance profile for the assigned customer class.'
        )
      });
    } else if (profile?.fatcaRegistered && !profile.fatcaRegistrationNo?.trim()) {
      issues.push({
        code: 'validation.msg.client.customerClassId.edd.fatca.required',
        message: activationMessage(
          'validation.msg.client.customerClassId.edd.fatca.required',
          'FATCA registration is required on the compliance profile for the assigned customer class.'
        )
      });
    }
  }

  return issues;
}

export function formatCustomerClassActivationIssues(
  issues: CustomerClassActivationIssue[]
): string | null {
  if (!issues.length) {
    return null;
  }
  return issues.map((issue) => issue.message).join('\n');
}
