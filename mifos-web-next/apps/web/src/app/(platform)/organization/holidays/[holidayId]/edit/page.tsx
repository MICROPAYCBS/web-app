/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { HolidayFormPage } from '@/components/organization/holiday-form-page';
import { holidayDateToFormString, isHolidayActive } from '@/lib/fineract/holiday-display';
import { getHoliday, getHolidayReschedulingTypes } from '@/lib/fineract/holidays';
import { listOffices } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationHolidayEditPage({
  params
}: {
  params: Promise<{ holidayId: string }>;
}) {
  const { holidayId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_HOLIDAY')) {
    notFound();
  }

  let holiday;
  try {
    holiday = await getHoliday(holidayId);
  } catch {
    notFound();
  }

  const [offices, reschedulingTypes] = await Promise.all([
    listOffices(),
    getHolidayReschedulingTypes()
  ]);

  const active = isHolidayActive(holiday.status);

  return (
    <HolidayFormPage
      mode="edit"
      holidayId={holiday.id}
      isActive={active}
      offices={offices}
      reschedulingTypes={reschedulingTypes}
      initial={{
        name: holiday.name,
        fromDate: holidayDateToFormString(holiday.fromDate),
        toDate: holidayDateToFormString(holiday.toDate),
        reschedulingType:
          holiday.reschedulingType != null ? String(holiday.reschedulingType) : '',
        repaymentsRescheduledTo: holidayDateToFormString(holiday.repaymentsRescheduledTo),
        description: holiday.description ?? ''
      }}
    />
  );
}
