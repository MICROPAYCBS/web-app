import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CenterCreateTemplate,
  CenterDetail,
  CenterEditTemplate,
  CenterGroupMember,
  CenterGroupOption,
  CenterMutationResponse,
  CenterSavingsAccount,
  CenterStaffOption,
  CenterSummary
} from '@mifos/api-client';
import type { CreateCenterPayload, UpdateCenterPayload } from '@mifos/validation';
import { format, isValid, parseISO } from 'date-fns';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

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

function normalizeGroupMember(raw: unknown): CenterGroupMember | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const group = raw as Record<string, unknown>;
  const groupId = Number(group.id);
  const groupName = typeof group.name === 'string' ? group.name : '';
  if (!Number.isFinite(groupId) || !groupName) {
    return null;
  }
  return {
    id: groupId,
    name: groupName,
    accountNo: typeof group.accountNo === 'string' ? group.accountNo : undefined,
    officeName: typeof group.officeName === 'string' ? group.officeName : undefined,
    status:
      group.status && typeof group.status === 'object'
        ? (group.status as CenterGroupMember['status'])
        : undefined,
    timeline:
      group.timeline && typeof group.timeline === 'object'
        ? (group.timeline as CenterGroupMember['timeline'])
        : undefined
  };
}

function normalizeGroupOption(raw: unknown): CenterGroupOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined
  };
}

function normalizeCenterDetail(raw: unknown): CenterDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const groupMembers = Array.isArray(row.groupMembers)
    ? row.groupMembers
        .map((item) => normalizeGroupMember(item))
        .filter((item): item is CenterGroupMember => item !== null)
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
        ? (row.status as CenterDetail['status'])
        : undefined,
    activationDate:
      typeof row.activationDate === 'string' || Array.isArray(row.activationDate)
        ? (row.activationDate as string | number[])
        : undefined,
    timeline:
      row.timeline && typeof row.timeline === 'object'
        ? (row.timeline as CenterDetail['timeline'])
        : undefined,
    groupMembers,
    collectionMeetingCalendar:
      row.collectionMeetingCalendar && typeof row.collectionMeetingCalendar === 'object'
        ? (row.collectionMeetingCalendar as CenterDetail['collectionMeetingCalendar'])
        : undefined
  };
}

function normalizeCenterSummary(raw: unknown): CenterSummary {
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

function normalizeSavingsAccounts(raw: unknown): CenterSavingsAccount[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const accounts: CenterSavingsAccount[] = [];
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
          ? (row.status as CenterSavingsAccount['status'])
          : undefined,
      depositType:
        row.depositType && typeof row.depositType === 'object'
          ? (row.depositType as CenterSavingsAccount['depositType'])
          : undefined
    });
  }
  return accounts;
}

export async function getCenterCreateTemplate(
  officeId?: string | number
): Promise<CenterCreateTemplate> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    staffInSelectedOfficeOnly: 'true'
  };
  if (officeId != null && officeId !== '') {
    searchParams.officeId = String(officeId);
  }
  const raw = await fineract.get<Record<string, unknown>>('/centers/template', searchParams);
  return {
    staffOptions: normalizeStaffOptions(raw.staffOptions)
  };
}

export async function listGroupsByOffice(officeId: string | number): Promise<CenterGroupOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/groups', { officeId: String(officeId) });
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)
      ? (raw as { pageItems: unknown[] }).pageItems
      : [];
  return rows
    .map((item) => normalizeGroupOption(item))
    .filter((item): item is CenterGroupOption => item !== null);
}

function formatCenterDateForApi(value: string | undefined): string | undefined {
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

export async function createCenter(payload: CreateCenterPayload): Promise<CenterMutationResponse> {
  const fineract = await createFineractClient();
  const body: Record<string, unknown> = {
    name: payload.name,
    officeId: payload.officeId,
    submittedOnDate: formatCenterDateForApi(payload.submittedOnDate),
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
    body.activationDate = formatCenterDateForApi(payload.activationDate);
  }
  if (payload.groupMembers?.length) {
    body.groupMembers = payload.groupMembers;
  }
  return fineract.post<CenterMutationResponse>('/centers', body);
}

export async function getCenter(centerId: string | number): Promise<CenterDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/centers/${centerId}`, {
    associations: 'groupMembers,collectionMeetingCalendar'
  });
  return normalizeCenterDetail(raw);
}

export async function getCenterSummary(centerId: string | number): Promise<CenterSummary> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/runreports/GroupSummaryCounts', {
    R_groupId: String(centerId),
    genericResultSet: 'false'
  });
  return normalizeCenterSummary(raw);
}

export async function getCenterSavingsAccounts(
  centerId: string | number
): Promise<CenterSavingsAccount[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/centers/${centerId}/accounts`);
  return normalizeSavingsAccounts(raw);
}

export async function getCenterEditTemplate(
  centerId: string | number
): Promise<CenterEditTemplate | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/centers/${centerId}`, {
    staffInSelectedOfficeOnly: 'true',
    template: 'true'
  });
  const detail = normalizeCenterDetail(raw);
  if (!detail || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...detail,
    staffOptions: normalizeStaffOptions(row.staffOptions)
  };
}

export async function updateCenter(
  centerId: string | number,
  payload: UpdateCenterPayload
): Promise<void> {
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
    body.activationDate = formatCenterDateForApi(payload.activationDate);
  }
  await fineract.put(`/groups/${centerId}`, body);
}

export function defaultCenterMutationMeta() {
  return {
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}
