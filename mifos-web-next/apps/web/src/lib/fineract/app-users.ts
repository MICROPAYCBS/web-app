import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  EntityMappingOption,
  FineractUserDetail,
  FineractUserListItem,
  FineractUserMutationResponse,
  FineractUserRoleRef,
  FineractUserStaffRef,
  FineractUserTemplate
} from '@mifos/api-client';
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

function normalizeUserRoles(row: Record<string, unknown>): FineractUserRoleRef[] {
  const source = row.selectedRoles ?? row.roles;
  if (!Array.isArray(source)) {
    return [];
  }
  return source
    .map((item) => normalizeRoleRef(item))
    .filter((item): item is FineractUserRoleRef => item !== null);
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

  const availableRoles = Array.isArray(row.availableRoles)
    ? row.availableRoles
        .map((item) => normalizeRoleRef(item))
        .filter((item): item is FineractUserRoleRef => item !== null)
    : [];

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
    passwordNeverExpires: input.passwordNeverExpires ?? false
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
    email: input.email,
    officeId: input.officeId,
    roles: input.roles,
    passwordNeverExpires: input.passwordNeverExpires ?? false
  };

  if (input.staffId != null) {
    payload.staffId = input.staffId;
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
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${USERS_PATH}/${userId}`, {
    firstname: input.firstname,
    password: input.password,
    repeatPassword: input.repeatPassword
  });
}

export async function deleteUser(userId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${USERS_PATH}/${userId}`);
}
