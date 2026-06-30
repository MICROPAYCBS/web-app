import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { EntityMappingOption,
  FineractUserDetail,
  FineractUserEditContext,
  FineractUserListItem,
  FineractUserMutationResponse,
  FineractUserRoleRef,
  FineractUserStaffRef,
  FineractUserTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import type {
  ChangeUserPasswordInput,
  CreateUserInput,
  UpdateUserInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const USERS_PATH = '/users';

function normalizeUserListItem(raw: unknown): FineractUserListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const username = typeof row.username === 'string' ? row.username.trim() : '';
  const firstname = typeof row.firstname === 'string' ? row.firstname.trim() : '';
  const lastname = typeof row.lastname === 'string' ? row.lastname.trim() : '';
  if (!Number.isFinite(id) || !username) {
    return null;
  }
  return {
    id,
    username,
    firstname,
    lastname,
    email: typeof row.email === 'string' ? row.email.trim() : '',
    officeName: typeof row.officeName === 'string' ? row.officeName.trim() : '',
    isSelfServiceUser: row.isSelfServiceUser === true
  };
}

function roleNameFromRow(row: Record<string, unknown>): string {
  if (typeof row.name === 'string' && row.name.trim()) {
    return row.name.trim();
  }
  if (typeof row.roleName === 'string' && row.roleName.trim()) {
    return row.roleName.trim();
  }
  if (typeof row.description === 'string' && row.description.trim()) {
    return row.description.trim();
  }
  return '';
}

function normalizeRoleRef(raw: unknown): FineractUserRoleRef | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { id: raw, name: `Role ${raw}` };
  }
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const nested =
    row.role && typeof row.role === 'object' ? (row.role as Record<string, unknown>) : row;
  const id = Number(nested.id ?? row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const name = roleNameFromRow(nested) || roleNameFromRow(row) || `Role ${id}`;
  return { id, name };
}

function normalizeRoleList(raw: unknown): FineractUserRoleRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeRoleRef(item))
    .filter((item): item is FineractUserRoleRef => item !== null);
}

function normalizeUserRoles(row: Record<string, unknown>): FineractUserRoleRef[] {
  const source = row.selectedRoles ?? row.roles;
  return normalizeRoleList(source);
}

function mergeRoleOptions(
  ...groups: FineractUserRoleRef[][]
): FineractUserRoleRef[] {
  const byId = new Map<number, FineractUserRoleRef>();
  for (const group of groups) {
    for (const role of group) {
      byId.set(role.id, role);
    }
  }
  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function mergeOfficeOptions(
  offices: FineractUserTemplate['allowedOffices'],
  current?: { id: number; name: string }
): FineractUserTemplate['allowedOffices'] {
  if (!current || offices.some((office) => office.id === current.id)) {
    return offices;
  }
  return [...offices, { id: current.id, name: current.name }].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

function normalizeStaffRef(raw: unknown): FineractUserStaffRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const displayName =
    typeof row.displayName === 'string'
      ? row.displayName.trim()
      : typeof row.firstname === 'string' && typeof row.lastname === 'string'
        ? `${row.firstname} ${row.lastname}`.trim()
        : '';
  if (!Number.isFinite(id) || !displayName) {
    return null;
  }
  return { id, displayName };
}

function normalizeUserDetail(raw: unknown): FineractUserDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const username = typeof row.username === 'string' ? row.username.trim() : '';
  const firstname = typeof row.firstname === 'string' ? row.firstname.trim() : '';
  const lastname = typeof row.lastname === 'string' ? row.lastname.trim() : '';
  const officeId = Number(row.officeId);
  if (!Number.isFinite(id) || !username || !Number.isFinite(officeId)) {
    return null;
  }

  const selectedRoles = normalizeUserRoles(row);

  const staff = row.staff ? normalizeStaffRef(row.staff) : null;

  return {
    id,
    username,
    firstname,
    lastname,
    email: typeof row.email === 'string' ? row.email.trim() : '',
    officeId,
    officeName: typeof row.officeName === 'string' ? row.officeName.trim() : '',
    isSelfServiceUser: row.isSelfServiceUser === true,
    passwordNeverExpires: row.passwordNeverExpires === true,
    isLoginRetriesEnabled: row.isLoginRetriesEnabled === true,
    isPasswordResetAllowed: row.isPasswordResetAllowed === true,
    selectedRoles,
    staff
  };
}

function normalizeUserList(raw: unknown): FineractUserListItem[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)
      ? (raw as { pageItems: unknown[] }).pageItems
      : [];

  return rows
    .map((item) => normalizeUserListItem(item))
    .filter((item): item is FineractUserListItem => item !== null)
    .sort((left, right) => left.username.localeCompare(right.username));
}

function normalizeNamedOptions(raw: unknown): EntityMappingOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name =
        typeof row.displayName === 'string'
          ? row.displayName.trim()
          : typeof row.firstname === 'string' && typeof row.lastname === 'string'
            ? `${row.firstname} ${row.lastname}`.trim()
            : typeof row.name === 'string'
              ? row.name.trim()
              : typeof row.nameDecorated === 'string'
                ? row.nameDecorated.trim()
                : '';
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is EntityMappingOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeUserTemplate(raw: unknown): FineractUserTemplate {
  if (!raw || typeof raw !== 'object') {
    return { allowedOffices: [], availableRoles: [] };
  }
  const row = raw as Record<string, unknown>;
  const allowedOffices = Array.isArray(row.allowedOffices)
    ? row.allowedOffices
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const office = item as Record<string, unknown>;
          const id = Number(office.id);
          const name =
            typeof office.nameDecorated === 'string'
              ? office.nameDecorated.trim()
              : typeof office.name === 'string'
                ? office.name.trim()
                : '';
          if (!Number.isFinite(id) || !name) {
            return null;
          }
          const officeEntry: FineractUserTemplate['allowedOffices'][number] = { id, name };
          if (typeof office.nameDecorated === 'string') {
            officeEntry.nameDecorated = office.nameDecorated;
          }
          return officeEntry;
        })
        .filter((item): item is FineractUserTemplate['allowedOffices'][number] => item !== null)
    : [];

  const availableRoles = normalizeRoleList(row.availableRoles);

  return { allowedOffices, availableRoles };
}

function buildCreatePayload(input: CreateUserInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    username: input.username,
    firstname: input.firstname,
    lastname: input.lastname,
    officeId: input.officeId,
    roles: input.roles,
    sendPasswordToEmail: input.sendPasswordToEmail,
    passwordNeverExpires: input.passwordNeverExpires ?? false,
    isLoginRetriesEnabled: input.isLoginRetriesEnabled ?? false
  };

  if (input.email?.trim()) {
    payload.email = input.email.trim();
  }
  if (input.staffId != null) {
    payload.staffId = input.staffId;
  }
  if (!input.sendPasswordToEmail) {
    payload.password = input.password;
    payload.repeatPassword = input.repeatPassword;
  }

  return payload;
}

function buildUpdatePayload(input: UpdateUserInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    username: input.username,
    firstname: input.firstname,
    lastname: input.lastname,
    officeId: input.officeId,
    staffId: input.staffId ?? null,
    roles: input.roles,
    passwordNeverExpires: input.passwordNeverExpires ?? false,
    isLoginRetriesEnabled: input.isLoginRetriesEnabled ?? false,
    isPasswordResetAllowed: input.isPasswordResetAllowed ?? false
  };

  const email = input.email?.trim();
  if (email) {
    payload.email = email;
  }

  return payload;
}

export async function listUsers(): Promise<FineractUserListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(USERS_PATH);
  return normalizeUserList(raw);
}

export async function getUserTemplate(): Promise<FineractUserTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${USERS_PATH}/template`);
  return normalizeUserTemplate(raw);
}

export async function getUser(userId: number): Promise<FineractUserDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${USERS_PATH}/${userId}`);
  return normalizeUserDetail(raw);
}

export async function getUserForEdit(userId: number): Promise<FineractUserEditContext | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${USERS_PATH}/${userId}`, { template: 'true' });
  const user = normalizeUserDetail(raw);
  if (!user) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const template = normalizeUserTemplate(raw);

  return {
    user,
    template: {
      allowedOffices: mergeOfficeOptions(template.allowedOffices, {
        id: user.officeId,
        name: user.officeName || `Office ${user.officeId}`
      }),
      availableRoles: mergeRoleOptions(
        template.availableRoles,
        normalizeRoleList(row.availableRoles),
        user.selectedRoles
      )
    }
  };
}

export async function listStaffByOffice(officeId: number): Promise<EntityMappingOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/staff', {
    officeId: String(officeId),
    status: 'all'
  });
  return normalizeNamedOptions(raw);
}

export async function createUser(input: CreateUserInput): Promise<FineractUserMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractUserMutationResponse>(USERS_PATH, buildCreatePayload(input));
}

export async function updateUser(
  userId: number,
  input: UpdateUserInput
): Promise<FineractUserMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractUserMutationResponse>(
    `${USERS_PATH}/${userId}`,
    buildUpdatePayload(input)
  );
}

export async function changeUserPassword(
  userId: number,
  input: ChangeUserPasswordInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`${USERS_PATH}/${userId}`, {
    firstname: input.firstname,
    password: input.password,
    repeatPassword: input.repeatPassword
  });
}

export async function deleteUser(userId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${USERS_PATH}/${userId}`);
}
