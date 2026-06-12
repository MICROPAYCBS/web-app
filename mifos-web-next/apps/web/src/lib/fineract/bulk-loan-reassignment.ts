import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  BulkLoanReassignmentAccountOwner,
  BulkLoanReassignmentAccountSummaryCollection,
  BulkLoanReassignmentLoanOfficerOption,
  BulkLoanReassignmentLoanSummary,
  BulkLoanReassignmentMutationResponse,
  BulkLoanReassignmentOfficeTemplate,
  BulkLoanReassignmentOfficerTemplate
} from '@mifos/api-client';
import type { BulkLoanReassignmentPayload } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/loans/loanreassignment';

function normalizeLoanOfficerOptions(value: unknown): BulkLoanReassignmentLoanOfficerOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const displayName =
        typeof row.displayName === 'string'
          ? row.displayName
          : typeof row.name === 'string'
            ? row.name
            : '';
      if (!Number.isFinite(id) || !displayName.trim()) {
        return null;
      }
      return { id, displayName: displayName.trim() };
    })
    .filter((item): item is BulkLoanReassignmentLoanOfficerOption => item !== null);
}

function normalizeLoanSummary(value: unknown): BulkLoanReassignmentLoanSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    productName: typeof row.productName === 'string' ? row.productName : undefined,
    accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined
  };
}

function normalizeAccountOwners(value: unknown): BulkLoanReassignmentAccountOwner[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const displayName = typeof row.displayName === 'string' ? row.displayName.trim() : '';
      const loans = Array.isArray(row.loans)
        ? row.loans
            .map((loan) => normalizeLoanSummary(loan))
            .filter((loan): loan is BulkLoanReassignmentLoanSummary => loan !== null)
        : [];
      if (!displayName) {
        return null;
      }
      return { displayName, loans };
    })
    .filter((item): item is BulkLoanReassignmentAccountOwner => item !== null);
}

function normalizeAccountSummaryCollection(
  value: unknown
): BulkLoanReassignmentAccountSummaryCollection {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    clients: normalizeAccountOwners(row.clients),
    groups: normalizeAccountOwners(row.groups)
  };
}

export async function getBulkLoanReassignmentOfficeTemplate(
  officeId: string | number
): Promise<BulkLoanReassignmentOfficeTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<Record<string, unknown>>(`${BASE_PATH}/template`, {
    officeId: String(officeId)
  });
  const resolvedOfficeId = Number(raw.officeId ?? officeId);
  return {
    officeId: Number.isFinite(resolvedOfficeId) ? resolvedOfficeId : Number(officeId),
    loanOfficerOptions: normalizeLoanOfficerOptions(raw.loanOfficerOptions)
  };
}

export async function getBulkLoanReassignmentOfficerTemplate(
  officeId: string | number,
  fromLoanOfficerId: string | number
): Promise<BulkLoanReassignmentOfficerTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<Record<string, unknown>>(`${BASE_PATH}/template`, {
    officeId: String(officeId),
    fromLoanOfficerId: String(fromLoanOfficerId)
  });
  return {
    accountSummaryCollection: normalizeAccountSummaryCollection(raw.accountSummaryCollection)
  };
}

export function buildBulkLoanReassignmentPayload(
  input: BulkLoanReassignmentPayload
): Record<string, unknown> {
  return {
    fromLoanOfficerId: input.fromLoanOfficerId,
    toLoanOfficerId: input.toLoanOfficerId,
    assignmentDate: input.assignmentDate,
    loans: input.loans,
    locale: input.locale ?? FINERACT_LOCALE,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT
  };
}

export async function createBulkLoanReassignment(
  input: BulkLoanReassignmentPayload
): Promise<BulkLoanReassignmentMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<BulkLoanReassignmentMutationResponse>(
    BASE_PATH,
    buildBulkLoanReassignmentPayload(input)
  );
}
