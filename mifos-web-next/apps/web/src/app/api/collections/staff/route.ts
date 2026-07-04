/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { listStaffByOffice } from '@/lib/fineract/staff';

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/collections/collection-sheet');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('collections'));
    const { searchParams } = new URL(request.url);
    const officeIdRaw = searchParams.get('officeId');
    const officeId = officeIdRaw != null ? Number(officeIdRaw) : NaN;

    if (!Number.isFinite(officeId) || officeId <= 0) {
      return jsonError(new Error('officeId must be a positive number'));
    }

    const staff = await listStaffByOffice(officeId);
    return jsonOk(
      staff.map((member) => ({
        id: member.id,
        displayName:
          [member.firstname, member.lastname].filter(Boolean).join(' ').trim() ||
          `Employee #${member.id}`,
        isLoanOfficer: member.isLoanOfficer ?? false
      }))
    );
  } catch (err) {
    return jsonError(err);
  }
}
