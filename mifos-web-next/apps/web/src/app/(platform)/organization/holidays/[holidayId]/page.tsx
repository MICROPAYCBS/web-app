/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { HolidayDetailView } from '@/components/organization/holiday-detail-view';
import { getHoliday } from '@/lib/fineract/holidays';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationHolidayDetailPage({
  params
}: {
  params: Promise<{ holidayId: string }>;
}) {
  const { holidayId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.holidays'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_HOLIDAY');
  const canDelete = can(session, 'DELETE_HOLIDAY');
  const canActivate = can(session, 'ACTIVATE_HOLIDAY');

  let holiday;
  try {
    holiday = await getHoliday(holidayId);
  } catch {
    notFound();
  }

  return (
    <HolidayDetailView
      holiday={holiday}
      canEdit={canEdit}
      canDelete={canDelete}
      canActivate={canActivate}
    />
  );
}
