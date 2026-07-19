/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { PeriodicAccrualsForm } from '@/components/accounting/periodic-accruals-form';
import { getServerSession } from '@/lib/session/server';

export default async function PeriodicAccrualsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.accruals'))) {
    notFound();
  }

  return (
    <PeriodicAccrualsForm canExecute={can(session, 'EXECUTE_PERIODICACCRUALACCOUNTING')} />
  );
}
