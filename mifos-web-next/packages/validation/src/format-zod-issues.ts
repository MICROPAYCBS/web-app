/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ZodIssue } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  officeId: 'Branch',
  staffId: 'Relationship officer',
  legalFormId: 'Profile type',
  firstname: 'First name',
  middlename: 'Middle name',
  lastname: 'Last name',
  fullname: 'Entity name',
  dateOfBirth: 'Date of birth',
  genderId: 'Gender',
  mobileNo: 'Phone number',
  alternativeMobileNo: 'Alternative phone number',
  clientTypeId: 'Customer type',
  customerClassId: 'Customer class',
  complianceProfile: 'Compliance profile',
  submittedOnDate: 'Submitted on',
  activationDate: 'Activation date',
  savingsProductId: 'Savings product',
  emailAddress: 'Email',
  alternativeEmailAddress: 'Alternative email',
  taxIdentificationNumber: 'Tax identification number (TIN)',
  subIndustryId: 'Sector / industry / sub-industry',
  constitutionId: 'Constitution',
  documentTypeId: 'Identifier type',
  documentKey: 'Identifier number',
  bankName: 'Bank name',
  accountNumber: 'Account number',
  pepPosition: 'PEP position',
  fatcaRegistrationNo: 'FATCA registration number',
  incomeSourceTypeId: 'Income source type',
  employerBusinessName: 'Employer / business name',
  employerAddress: 'Employer / business address',
  occupation: 'Occupation',
  monthlyIncome: 'Monthly income',
  addressTypeId: 'Address type',
  street: 'Street',
  city: 'City',
  townVillage: 'Town / village',
  postalCode: 'Postal code'
};

function labelForPath(path: (string | number)[]): string {
  const segments = path.map(String);
  const leaf = segments[segments.length - 1];
  if (leaf && FIELD_LABELS[leaf]) {
    if (segments[0] === 'incomeSources' && segments.length >= 2) {
      const index = Number(segments[1]) + 1;
      return `Income source ${index} — ${FIELD_LABELS[leaf]}`;
    }
    if (segments[0] === 'clientIdentifiers' && segments.length >= 2) {
      const index = Number(segments[1]) + 1;
      return `Identifier ${index} — ${FIELD_LABELS[leaf]}`;
    }
    if (segments[0] === 'familyMembers' && segments.length >= 2) {
      const index = Number(segments[1]) + 1;
      return `Next of kin ${index} — ${FIELD_LABELS[leaf]}`;
    }
    if (segments[0] === 'address' && segments.length >= 2) {
      const index = Number(segments[1]) + 1;
      return `Address ${index} — ${FIELD_LABELS[leaf]}`;
    }
    if (segments[0] === 'complianceProfile') {
      return `Compliance — ${FIELD_LABELS[leaf]}`;
    }
    return FIELD_LABELS[leaf];
  }

  if (segments[0] === 'address' && segments.length === 1) {
    return 'Address';
  }
  if (segments[0] === 'otherBankAccounts') {
    return 'Compliance — other bank account';
  }

  return segments.join(' › ');
}

function humanizeIssueMessage(label: string, message: string): string {
  if (message === 'Required' || message === 'Required.') {
    return `${label} is required`;
  }
  if (label && !message.toLowerCase().includes(label.toLowerCase())) {
    return `${label}: ${message}`;
  }
  return message;
}

/** Turn Zod issues into user-facing sentences (includes field labels). */
export function formatZodIssuesForDisplay(issues: ZodIssue[]): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const label = labelForPath(issue.path);
    const line = humanizeIssueMessage(label, issue.message);
    if (!seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }

  return lines;
}

export function formatZodIssuesMessage(issues: ZodIssue[]): string {
  const lines = formatZodIssuesForDisplay(issues);
  return lines.join(' ') || 'Validation failed. Go back and fix the form.';
}
