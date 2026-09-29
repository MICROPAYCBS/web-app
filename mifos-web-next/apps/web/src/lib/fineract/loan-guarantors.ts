/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import {
  GUARANTOR_TYPE_GROUP,
  type LoanGuarantorItemInput,
  type UpdateLoanGuarantorInput
} from '@mifos/validation';
import type {
  ClientObligeeRecord,
  LoanGuaranteeSettings,
  LoanGuarantorFundingRecord,
  LoanGuarantorRecord,
  LoanGuarantorRelationshipOption,
  LoanGuarantorSavingsAccountOption,
  LoanGuarantorTypeOption
} from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  buildLoanGuarantorPayload,
  buildLoanGuarantorUpdatePayload
} from '@/lib/fineract/client-loan-account-payload';
import { fineractApiDateToFormString, formatFineractDateValue } from '@/lib/fineract/dates';
import { getGroup } from '@/lib/fineract/groups';

export type {
  ClientObligeeRecord,
  LoanGuaranteeSettings,
  LoanGuarantorRecord,
  LoanGuarantorRelationshipOption,
  LoanGuarantorSavingsAccountOption,
  LoanGuarantorTypeOption
};

export type LoanGuarantorTemplate = {
  guarantorTypeOptions: LoanGuarantorTypeOption[];
  relationshipOptions: LoanGuarantorRelationshipOption[];
  defaultGuarantorTypeId?: number;
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function listFrom(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown }).pageItems)) {
    return (raw as { pageItems: unknown[] }).pageItems;
  }
  return [];
}

function normalizeFunding(raw: unknown): LoanGuarantorFundingRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const status =
    row.status && typeof row.status === 'object' ? (row.status as Record<string, unknown>) : undefined;
  const savings =
    row.savingsAccount && typeof row.savingsAccount === 'object'
      ? (row.savingsAccount as Record<string, unknown>)
      : undefined;
  return {
    id,
    statusId: toNumber(status?.id),
    statusLabel: text(status?.value),
    savingsAccountId: toNumber(savings?.id),
    savingsAccountNo: text(savings?.accountNo),
    amount: toNumber(row.amount),
    amountReleased: toNumber(row.amountReleased),
    amountRemaining: toNumber(row.amountRemaining),
    amountTransferred: toNumber(row.amountTransferred ?? row.amountTransfered)
  };
}

function normalizeGuarantor(raw: unknown): LoanGuarantorRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const type =
    row.guarantorType && typeof row.guarantorType === 'object'
      ? (row.guarantorType as Record<string, unknown>)
      : undefined;
  const relationship =
    row.clientRelationshipType && typeof row.clientRelationshipType === 'object'
      ? (row.clientRelationshipType as Record<string, unknown>)
      : undefined;
  const firstname = text(row.firstname);
  const lastname = text(row.lastname);
  const displayName = [firstname, lastname].filter(Boolean).join(' ').trim() || undefined;
  const funding = Array.isArray(row.guarantorFundingDetails)
    ? row.guarantorFundingDetails
        .map((item) => normalizeFunding(item))
        .filter((item): item is LoanGuarantorFundingRecord => item != null)
    : [];
  const joined = row.joinedDate as number[] | string | undefined;
  const dob = row.dob as number[] | string | undefined;
  return {
    id,
    active: row.status !== false,
    guarantorTypeId: toNumber(type?.id),
    guarantorTypeName: text(type?.value),
    entityId: toNumber(row.entityId),
    clientRelationshipTypeId: toNumber(relationship?.id),
    clientRelationshipTypeName: text(relationship?.name),
    firstname,
    lastname,
    displayName,
    addressLine1: text(row.addressLine1),
    addressLine2: text(row.addressLine2),
    city: text(row.city),
    state: text(row.state),
    country: text(row.country),
    zip: text(row.zip),
    mobileNumber: text(row.mobileNumber),
    housePhoneNumber: text(row.housePhoneNumber),
    comment: text(row.comment),
    dob: fineractApiDateToFormString(dob),
    officeName: text(row.officeName),
    joinedDate: formatFineractDateValue(joined),
    externalId: text(row.externalId),
    funding
  };
}

async function withGroupNames(records: LoanGuarantorRecord[]): Promise<LoanGuarantorRecord[]> {
  const groupIds = [
    ...new Set(
      records
        .filter((record) => record.guarantorTypeId === GUARANTOR_TYPE_GROUP && record.entityId != null)
        .map((record) => record.entityId as number)
    )
  ];
  if (groupIds.length === 0) {
    return records;
  }
  const names = new Map<number, string>();
  await Promise.all(
    groupIds.map(async (groupId) => {
      try {
        const group = await getGroup(groupId);
        const name = group?.name?.trim();
        if (name) {
          names.set(groupId, name);
        }
      } catch {
        // The list still renders; the row falls back to "Group".
      }
    })
  );
  return records.map((record) =>
    record.entityId != null && names.has(record.entityId)
      ? { ...record, groupName: names.get(record.entityId) }
      : record
  );
}

export async function getLoanGuarantors(
  accountId: string | number
): Promise<LoanGuarantorRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/guarantors`);
  const records = listFrom(data)
    .map((item) => normalizeGuarantor(item))
    .filter((item): item is LoanGuarantorRecord => item != null);
  return withGroupNames(records);
}

function normalizeTypeOption(raw: unknown): LoanGuarantorTypeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = text(row.value);
  if (!Number.isFinite(id) || !value) {
    return null;
  }
  return { id, value, code: text(row.code) };
}

function normalizeRelationship(raw: unknown): LoanGuarantorRelationshipOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = text(row.name) ?? text(row.value);
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { id, name };
}

export async function getLoanGuarantorTemplate(
  accountId: string | number
): Promise<LoanGuarantorTemplate> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/guarantors/template`);
  if (!data || typeof data !== 'object') {
    return { guarantorTypeOptions: [], relationshipOptions: [] };
  }
  const row = data as Record<string, unknown>;
  const guarantorTypeOptions = listFrom(row.guarantorTypeOptions)
    .map((item) => normalizeTypeOption(item))
    .filter((item): item is LoanGuarantorTypeOption => item != null);
  const relationshipOptions = listFrom(row.allowedClientRelationshipTypes)
    .map((item) => normalizeRelationship(item))
    .filter((item): item is LoanGuarantorRelationshipOption => item != null);
  const selected = normalizeTypeOption(row.guarantorType);
  return {
    guarantorTypeOptions,
    relationshipOptions,
    defaultGuarantorTypeId: selected?.id ?? guarantorTypeOptions[0]?.id
  };
}

export async function getLoanGuarantorSavingsAccounts(
  accountId: string | number,
  clientId: string | number
): Promise<LoanGuarantorSavingsAccountOption[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(
    `/loans/${accountId}/guarantors/accounts/template`,
    { clientId: String(clientId) }
  );
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const accounts = listFrom(row.accountLinkingOptions ?? row.savingsAccounts ?? data);
  return accounts.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const account = item as Record<string, unknown>;
    const id = Number(account.id);
    if (!Number.isFinite(id)) {
      return [];
    }
    const currency =
      account.currency && typeof account.currency === 'object'
        ? (account.currency as Record<string, unknown>)
        : undefined;
    return [
      {
        id,
        accountNo: text(account.accountNo),
        productName: text(account.productName),
        currencyCode: text(currency?.code)
      }
    ];
  });
}

export async function getLoanGuaranteeSettings(
  productId: string | number
): Promise<LoanGuaranteeSettings> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loanproducts/${productId}`);
  if (!raw || typeof raw !== 'object') {
    return { holdGuaranteeFunds: false };
  }
  const row = raw as Record<string, unknown>;
  const guarantee =
    row.productGuaranteeData && typeof row.productGuaranteeData === 'object'
      ? (row.productGuaranteeData as Record<string, unknown>)
      : row;
  return {
    holdGuaranteeFunds: row.holdGuaranteeFunds === true,
    mandatoryGuarantee: toNumber(guarantee.mandatoryGuarantee),
    minimumGuaranteeFromOwnFunds: toNumber(guarantee.minimumGuaranteeFromOwnFunds),
    minimumGuaranteeFromGuarantor: toNumber(guarantee.minimumGuaranteeFromGuarantor)
  };
}

export async function createLoanGuarantor(
  accountId: string | number,
  input: LoanGuarantorItemInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors`,
    buildLoanGuarantorPayload(input)
  );
}

export async function updateLoanGuarantor(
  accountId: string | number,
  guarantorId: number,
  input: UpdateLoanGuarantorInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors/${guarantorId}`,
    buildLoanGuarantorUpdatePayload(input)
  );
}

export async function deleteLoanGuarantor(
  accountId: string | number,
  guarantorId: number,
  guarantorFundingId?: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/loans/${accountId}/guarantors/${guarantorId}`,
    guarantorFundingId != null ? { guarantorFundingId: String(guarantorFundingId) } : undefined
  );
}

export async function recoverLoanGuarantees(
  accountId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/loans/${accountId}`, {}, {
    command: 'recoverGuarantees'
  });
}

export async function listGuarantorGroupOptions(): Promise<{ id: number; name: string }[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/groups');
  return listFrom(data).flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const row = item as Record<string, unknown>;
    const id = Number(row.id);
    const name = text(row.name);
    if (!Number.isFinite(id) || !name) {
      return [];
    }
    return [{ id, name }];
  });
}

export async function getClientObligeeDetails(
  clientId: string | number
): Promise<ClientObligeeRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/clients/${clientId}/obligeedetails`);
  return listFrom(data).flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const row = item as Record<string, unknown>;
    const firstName = text(row.firstName ?? row.firstname);
    const lastName = text(row.lastName ?? row.lastname);
    return [
      {
        displayName:
          text(row.displayName) ??
          ([firstName, lastName].filter(Boolean).join(' ').trim() || undefined),
        accountNumber: text(row.accountNumber ?? row.accountNo),
        loanAmount: toNumber(row.loanAmount),
        guaranteeAmount: toNumber(row.guaranteeAmount),
        amountReleased: toNumber(row.amountReleased),
        amountTransferred: toNumber(row.amountTransferred ?? row.amountTransfered)
      }
    ];
  });
}
