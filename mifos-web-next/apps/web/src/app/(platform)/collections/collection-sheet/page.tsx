/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { CollectionSheetPageContent } from '@/components/collections/collection-sheet-page-content';
import { getBusinessDateContext } from '@/lib/fineract/business-date';
import { resolveTransactionDate } from '@/lib/fineract/business-date-context';
import { dateToFineract } from '@/lib/fineract/date-input';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { listOffices } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

function resolveDefaultOfficeId(
  sessionOfficeId: number,
  offices: { id: number }[]
): number | null {
  if (offices.some((office) => office.id === sessionOfficeId)) {
    return sessionOfficeId;
  }
  return offices[0]?.id ?? null;
}

export default async function CollectionSheetPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('collections'))) {
    notFound();
  }

  const offices = await listOffices().catch(() => []);
  const defaultOfficeId =
    offices.length > 0 ? resolveDefaultOfficeId(session!.officeId, offices) : null;

  const businessDateContext = await getBusinessDateContext().catch(() => null);
  const today = dateToFineract(new Date()) ?? format(new Date(), FINERACT_DATE_FORMAT);
  const defaultTransactionDate = resolveTransactionDate(
    businessDateContext ?? { enabled: false },
    today
  );

  return (
    <CollectionSheetPageContent
      offices={offices.map((office) => ({ id: office.id, name: office.name }))}
      defaultOfficeId={defaultOfficeId}
      defaultTransactionDate={defaultTransactionDate}
    />
  );
}
