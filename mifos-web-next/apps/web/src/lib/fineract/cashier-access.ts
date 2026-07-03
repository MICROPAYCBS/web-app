import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem } from '@mifos/api-client';
import { can, resolvePermission, type SessionUser } from '@mifos/auth';
import { getUser } from '@/lib/fineract/app-users';
import type { ServerSession } from '@/lib/session/types';

export class CashierAccessError extends Error {
  constructor(message = 'You do not have permission to view this cashier.') {
    super(message);
    this.name = 'CashierAccessError';
  }
}

export function canReadAllOrganizationCashiers(
  session: SessionUser | null | undefined
): boolean {
  return can(session, resolvePermission('organization.tellers'));
}

export function canReadOwnCashier(session: SessionUser | null | undefined): boolean {
  return can(session, resolvePermission('organization.cashiers.readSelf'));
}

export function canViewOrganizationCashierRoute(
  session: SessionUser | null | undefined
): boolean {
  return can(session, resolvePermission('organization.cashiers.view'));
}

export function canOpenCashierDetail(session: SessionUser | null | undefined): boolean {
  return canReadOwnCashier(session) || canReadAllOrganizationCashiers(session);
}

export async function getSessionStaffId(userId: number): Promise<number | null> {
  const user = await getUser(userId);
  const staffId = user?.staff?.id;
  return staffId != null && Number.isFinite(staffId) ? staffId : null;
}

export function cashierBelongsToStaff(
  cashier: Pick<OrganizationCashierListItem, 'staffId'>,
  staffId: number
): boolean {
  return cashier.staffId != null && cashier.staffId === staffId;
}

/** Managers may view any cashier; tellers only their own assignment. */
export async function assertCanViewCashier(
  session: ServerSession | null | undefined,
  cashier: Pick<OrganizationCashierListItem, 'staffId'>
): Promise<void> {
  if (!session) {
    throw new CashierAccessError();
  }

  if (canReadAllOrganizationCashiers(session)) {
    return;
  }

  if (!canReadOwnCashier(session)) {
    throw new CashierAccessError();
  }

  const staffId = await getSessionStaffId(session.userId);
  if (staffId == null || !cashierBelongsToStaff(cashier, staffId)) {
    throw new CashierAccessError();
  }
}

export async function canViewCashier(
  session: ServerSession | null | undefined,
  cashier: Pick<OrganizationCashierListItem, 'staffId'>
): Promise<boolean> {
  try {
    await assertCanViewCashier(session, cashier);
    return true;
  } catch {
    return false;
  }
}
