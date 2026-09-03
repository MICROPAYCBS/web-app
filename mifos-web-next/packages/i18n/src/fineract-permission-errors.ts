/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractErrorBody } from './fineract-error-message';

const PERMISSION_CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

const AUTHORITY_TO_PATTERN = /\bno authority to(?:\s+be a checker for)?:\s*([A-Z][A-Z0-9_]+)/i;

export const GENERIC_PERMISSION_MESSAGES = new Set([
  'You do not have permission to perform this action.',
  'Insufficient privileges to perform this action.'
]);

/** Fineract GET resource segment → typical READ_* permission (fallback when the body is generic). */
const API_READ_PERMISSION_BY_RESOURCE: Record<string, string> = {
  currencies: 'READ_CURRENCY',
  journalentries: 'READ_JOURNALENTRY',
  glaccounts: 'READ_GLACCOUNT',
  offices: 'READ_OFFICE',
  departments: 'READ_DEPARTMENT',
  funds: 'READ_FUND',
  staff: 'READ_STAFF',
  clients: 'READ_CLIENT',
  loans: 'READ_LOAN',
  savingsaccounts: 'READ_SAVINGSACCOUNT',
  charges: 'READ_CHARGE',
  codes: 'READ_CODE',
  permissions: 'READ_PERMISSION',
  roles: 'READ_ROLE',
  users: 'READ_USER',
  tellers: 'READ_TELLER',
  holidays: 'READ_HOLIDAY',
  paymenttypes: 'READ_PAYMENTTYPE',
  datatables: 'READ_DATATABLE',
  reports: 'READ_REPORT',
  runreports: 'READ_REPORT',
  configurations: 'READ_CONFIGURATION',
  surveys: 'READ_SURVEY',
  hooks: 'READ_HOOK',
  jobs: 'READ_SCHEDULER',
  provisioningentries: 'READ_PROVISIONINGENTRY',
  accountnumberformats: 'READ_ACCOUNTNUMBERFORMAT',
  taxcomponents: 'READ_TAXCOMPONENT',
  taxgroups: 'READ_TAXGROUP',
  standinginstructions: 'READ_STANDINGINSTRUCTION',
  makercheckers: 'READ_MAKERCHECKER',
  glclosures: 'READ_GLCLOSURE',
  accountingrules: 'READ_ACCOUNTINGRULE',
  financialactivityaccounts: 'READ_FINANCIALACTIVITYACCOUNT',
  loanproducts: 'READ_LOANPRODUCT',
  savingsproducts: 'READ_SAVINGSPRODUCT',
  shareproducts: 'READ_SHAREPRODUCT',
  fixeddepositproducts: 'READ_FIXEDDEPOSITPRODUCT',
  recurringdepositproducts: 'READ_RECURRINGDEPOSITPRODUCT',
  floatingrates: 'READ_FLOATINGRATE',
  collateral: 'READ_COLLATERAL',
  delinquencyranges: 'READ_DELINQUENCY_RANGE',
  delinquencybuckets: 'READ_DELINQUENCY_BUCKET',
  legalentity: 'READ_CLIENT',
  audits: 'READ_AUDIT',
  externalevents: 'READ_EXTERNAL_EVENT_CONFIGURATION',
  entitymapping: 'READ_ENTITYMAPPING',
  externalservices: 'READ_EXTERNALSERVICES',
  workingdays: 'READ_WORKINGDAYS',
  smscampaigns: 'READ_SMSCAMPAIGN',
  adhocquery: 'READ_ADHOC',
  collectionsheet: 'READ_COLLECTIONSHEET',
  jobsequences: 'READ_JOBSEQUENCE',
  workflowdefinitions: 'READ_WORKFLOW_DEFINITION',
  twofactor: 'READ_TWOFACTOR_CONFIGURATION',
  usersessions: 'READ_USERSESSION',
  templates: 'READ_TEMPLATE'
};

export function extractFineractPermissionCode(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (PERMISSION_CODE_PATTERN.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(AUTHORITY_TO_PATTERN);
  return match?.[1] ?? null;
}

export function collectFineractPermissionCodes(body: FineractErrorBody): string[] {
  const codes = new Set<string>();
  const scan = (value?: string | null) => {
    if (!value) {
      return;
    }
    const code = extractFineractPermissionCode(value);
    if (code) {
      codes.add(code);
    }
  };

  scan(body.defaultUserMessage);
  scan(body.developerMessage);
  for (const item of body.errors ?? []) {
    scan(item.defaultUserMessage);
    scan(item.developerMessage);
    scan(item.parameterName);
  }

  return [...codes];
}

export function inferReadPermissionFromApiPath(path: string | undefined): string | null {
  if (!path?.trim()) {
    return null;
  }
  const normalized = path.trim().replace(/^\//, '').split('/')[0]?.toLowerCase();
  if (!normalized) {
    return null;
  }
  return API_READ_PERMISSION_BY_RESOURCE[normalized] ?? null;
}

export function formatMissingPermissionMessage(permissionCode: string): string {
  return `You do not have permission to perform this action. Required permission: ${permissionCode}.`;
}

export function isGenericPermissionMessage(message: string): boolean {
  return GENERIC_PERMISSION_MESSAGES.has(message.trim());
}

export function resolveFineractPermissionDeniedMessage(
  body: FineractErrorBody | null | undefined,
  httpStatus: number | undefined,
  requestPath: string | undefined,
  resolvedMessage: string
): string {
  const codes = body ? collectFineractPermissionCodes(body) : [];
  const permissionCode =
    codes[0] ??
    extractFineractPermissionCode(resolvedMessage) ??
    inferReadPermissionFromApiPath(httpStatus === 403 ? requestPath : undefined);

  const shouldFormat =
    Boolean(permissionCode) &&
    (httpStatus === 403 ||
      isGenericPermissionMessage(resolvedMessage) ||
      resolvedMessage === permissionCode);

  if (permissionCode && shouldFormat) {
    return formatMissingPermissionMessage(permissionCode);
  }

  return resolvedMessage;
}
