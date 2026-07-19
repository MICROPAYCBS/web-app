import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  GroupAccounts,
  GroupClientMember,
  GroupClientOption,
  GroupCreateTemplate,
  GroupDetail,
  GroupEditTemplate,
  GroupLoanAccount,
  GroupMutationResponse,
  GroupSavingsAccount,
  GroupSummary
} from '@mifos/api-client';
import type { CenterStaffOption } from '@mifos/api-client';
import type { CreateGroupPayload, UpdateGroupPayload } from '@mifos/validation';
import { format, isValid, parseISO } from 'date-fns';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';
import { searchClientEntities } from '@/lib/fineract/search';

function normalizeStaffOptions(value: unknown): CenterStaffOption[] {
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
          : typeof row.firstname === 'string' && typeof row.lastname === 'string'
            ? `${row.firstname} ${row.lastname}`.trim()
            : '';
      if (!Number.isFinite(id) || !displayName) {
        return null;
      }
      return { id, displayName };
    })
    .filter((item): item is CenterStaffOption => item !== null);
}

function normalizeClientMember(raw: unknown): GroupClientMember | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const client = raw as Record<string, unknown>;
  const id = Number(client.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const displayName =
    typeof client.displayName === 'string'
      ? client.displayName
      : typeof client.firstname === 'string' && typeof client.lastname === 'string'
        ? `${client.firstname} ${client.lastname}`.trim()
        : typeof client.name === 'string'
          ? client.name
          : undefined;
  return {
    id,
    displayName,
    accountNo: typeof client.accountNo === 'string' ? client.accountNo : undefined,
    officeName: typeof client.officeName === 'string' ? client.officeName : undefined,
    status:
      client.status && typeof client.status === 'object'
        ? (client.status as GroupClientMember['status'])
        : undefined,
    timeline:
      client.timeline && typeof client.timeline === 'object'
        ? (client.timeline as GroupClientMember['timeline'])
        : undefined
  };
}

function normalizeClientOption(raw: unknown): GroupClientOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const displayName =
    typeof row.displayName === 'string'
      ? row.displayName
      : typeof row.firstname === 'string' && typeof row.lastname === 'string'
        ? `${row.firstname} ${row.lastname}`.trim()
        : '';
  if (!Number.isFinite(id) || !displayName) {
    return null;
  }
  return {
    id,
    displayName,
    accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined
  };
}

function normalizeGroupDetail(raw: unknown): GroupDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const clientMembers = Array.isArray(row.clientMembers)
    ? row.clientMembers
        .map((item) => normalizeClientMember(item))
        .filter((item): item is GroupClientMember => item !== null)
    : undefined;

  return {
    id,
    name,
    accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    officeId: Number.isFinite(Number(row.officeId)) ? Number(row.officeId) : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    staffId: Number.isFinite(Number(row.staffId)) ? Number(row.staffId) : undefined,
    staffName: typeof row.staffName === 'string' ? row.staffName : undefined,
    status:
      row.status && typeof row.status === 'object'
        ? (row.status as GroupDetail['status'])
        : undefined,
    activationDate:
      typeof row.activationDate === 'string' || Array.isArray(row.activationDate)
        ? (row.activationDate as string | number[])
        : undefined,
    timeline:
      row.timeline && typeof row.timeline === 'object'
        ? (row.timeline as GroupDetail['timeline'])
        : undefined,
    clientMembers
  };
}

function normalizeGroupSummary(raw: unknown): GroupSummary {
  const row = Array.isArray(raw) && raw[0] && typeof raw[0] === 'object' ? raw[0] : raw;
  if (!row || typeof row !== 'object') {
    return {};
  }
  const data = row as Record<string, unknown>;
  const readNumber = (key: string) =>
    Number.isFinite(Number(data[key])) ? Number(data[key]) : undefined;
  return {
    activeClients: readNumber('Active Clients'),
    activeGroupLoans: readNumber('Active Group Loans'),
    activeClientLoans: readNumber('Active Client Loans'),
    overdueGroupLoans: readNumber('Active Overdue Group Loans'),
    activeGroupBorrowers: readNumber('Active Group Borrowers'),
    activeClientBorrowers: readNumber('Active Client Borrowers'),
    overdueClientLoans: readNumber('Active Overdue Client Loans')
  };
}

function normalizeSavingsAccounts(raw: unknown): GroupSavingsAccount[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const accounts: GroupSavingsAccount[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = Number(row.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    accounts.push({
      id,
      accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
      productName: typeof row.productName === 'string' ? row.productName : undefined,
      accountBalance: Number.isFinite(Number(row.accountBalance))
        ? Number(row.accountBalance)
        : undefined,
      status:
        row.status && typeof row.status === 'object'
          ? (row.status as GroupSavingsAccount['status'])
          : undefined,
      depositType:
        row.depositType && typeof row.depositType === 'object'
          ? (row.depositType as GroupSavingsAccount['depositType'])
          : undefined
    });
  }
  return accounts;
}

function normalizeLoanAccounts(raw: unknown): GroupLoanAccount[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const accounts: GroupLoanAccount[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = Number(row.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    accounts.push({
      id,
      accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
      productName: typeof row.productName === 'string' ? row.productName : undefined,
      loanBalance: Number.isFinite(Number(row.loanBalance)) ? Number(row.loanBalance) : undefined,
      originalLoan: Number.isFinite(Number(row.originalLoan)) ? Number(row.originalLoan) : undefined,
      status:
        row.status && typeof row.status === 'object'
          ? (row.status as GroupLoanAccount['status'])
          : undefined
    });
  }
  return accounts;
}

function formatGroupDateForApi(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = parseISO(value);
    if (isValid(parsed)) {
      return format(parsed, FINERACT_DATE_FORMAT);
    }
  }
  return value;
}

export async function getGroupCreateTemplate(
  officeId?: string | number
): Promise<GroupCreateTemplate> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    staffInSelectedOfficeOnly: 'true'
  };
  if (officeId != null && officeId !== '') {
    searchParams.officeId = String(officeId);
  }
  const raw = await fineract.get<Record<string, unknown>>('/groups/template', searchParams);
  return {
    staffOptions: normalizeStaffOptions(raw.staffOptions)
  };
}

export async function searchClientsForGroup(
  officeId: string | number,
  displayName: string
): Promise<GroupClientOption[]> {
  const officeIdNum = Number(officeId);
  const hits = await searchClientEntities(displayName, {
    officeId: Number.isFinite(officeIdNum) ? officeIdNum : undefined,
    limit: 20
  });
  return hits.map((hit) => ({
    id: hit.id,
    displayName: hit.displayName,
    accountNo: hit.accountNo,
    officeName: hit.officeName
  }));
}

export async function createGroup(payload: CreateGroupPayload): Promise<GroupMutationResponse> {
  const fineract = await createFineractClient();
  const body: Record<string, unknown> = {
    name: payload.name,
    officeId: payload.officeId,
    submittedOnDate: formatGroupDateForApi(payload.submittedOnDate),
    dateFormat: payload.dateFormat,
    locale: payload.locale
  };
  if (payload.staffId) {
    body.staffId = payload.staffId;
  }
  if (payload.externalId) {
    body.externalId = payload.externalId;
  }
  if (payload.active) {
    body.active = true;
    body.activationDate = formatGroupDateForApi(payload.activationDate);
  }
  if (payload.clientMembers?.length) {
    body.clientMembers = payload.clientMembers;
  }
  return fineract.post<GroupMutationResponse>('/groups', body);
}

export async function getGroup(groupId: string | number): Promise<GroupDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/groups/${groupId}`, {
    associations: 'all'
  });
  return normalizeGroupDetail(raw);
}

export async function getGroupSummary(groupId: string | number): Promise<GroupSummary> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/runreports/GroupSummaryCounts', {
    R_groupId: String(groupId),
    genericResultSet: 'false'
  });
  return normalizeGroupSummary(raw);
}

export async function getGroupAccounts(groupId: string | number): Promise<GroupAccounts> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/groups/${groupId}/accounts`);
  if (!raw || typeof raw !== 'object') {
    return { savingsAccounts: [], loanAccounts: [] };
  }
  const row = raw as Record<string, unknown>;
  return {
    savingsAccounts: normalizeSavingsAccounts(row.savingsAccounts),
    loanAccounts: normalizeLoanAccounts(row.loanAccounts)
  };
}

export async function getGroupEditTemplate(
  groupId: string | number
): Promise<GroupEditTemplate | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/groups/${groupId}`, {
    staffInSelectedOfficeOnly: 'true',
    template: 'true'
  });
  const detail = normalizeGroupDetail(raw);
  if (!detail || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...detail,
    staffOptions: normalizeStaffOptions(row.staffOptions)
  };
}

export async function updateGroup(
  groupId: string | number,
  payload: UpdateGroupPayload
): Promise<unknown> {
  const fineract = await createFineractClient();
  const body: Record<string, unknown> = {
    name: payload.name,
    dateFormat: payload.dateFormat,
    locale: payload.locale
  };
  if (payload.staffId != null) {
    body.staffId = payload.staffId;
  }
  if (payload.externalId != null) {
    body.externalId = payload.externalId;
  }
  if (payload.activationDate) {
    body.activationDate = formatGroupDateForApi(payload.activationDate);
  }
  return fineract.put(`/groups/${groupId}`, body);
}

export function defaultGroupMutationMeta() {
  return {
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}
